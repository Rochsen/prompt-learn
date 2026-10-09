"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRequestError, testConnection } from "@/lib/evaluate";
import {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  MODEL_OPTIONS,
  readSettings,
  writeSettings,
} from "@/lib/storage";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ModelFieldProps = {
  value: string;
  dialogOpen: boolean;
  onChange: (value: string) => void;
};

function ModelField({ value, dialogOpen, onChange }: ModelFieldProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const keyword = value.trim().toLowerCase();
  const options = MODEL_OPTIONS.filter((option) => option.toLowerCase().includes(keyword));

  useEffect(() => {
    if (!dialogOpen) {
      setMenuOpen(false);
    }
  }, [dialogOpen]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <Input
        id="model"
        value={value}
        placeholder={DEFAULT_MODEL}
        autoComplete="off"
        onFocus={() => setMenuOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setMenuOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setMenuOpen(false);
          }
        }}
      />
      {menuOpen && options.length > 0 ? (
        <ul className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(option);
                  setMenuOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [baseURL, setBaseURL] = useState(DEFAULT_BASE_URL);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const settings = readSettings();
    setBaseURL(settings.baseURL);
    setApiKey(settings.apiKey);
    setModel(settings.model);
    setMessage("");
    setMessageIsError(false);
  }, [open]);

  function handleSave() {
    writeSettings({
      baseURL: baseURL.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
    });
    setMessage("已保存");
    setMessageIsError(false);
  }

  async function handleTest() {
    if (!baseURL.trim() || !apiKey.trim()) {
      setMessage("请先填写 baseURL 和 API Key");
      setMessageIsError(true);
      return;
    }
    setTesting(true);
    setMessage("");
    try {
      await testConnection({ baseURL, apiKey, model });
      setMessage("连接成功");
      setMessageIsError(false);
    } catch (error) {
      setMessage(formatRequestError(error));
      setMessageIsError(true);
    } finally {
      setTesting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API 配置</DialogTitle>
          <DialogDescription>填写 OpenAI 兼容接口，保存后用于评分。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="base-url">baseURL</Label>
            <Input
              id="base-url"
              value={baseURL}
              placeholder={DEFAULT_BASE_URL}
              onChange={(event) => setBaseURL(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="api-key">apiKey</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              placeholder="sk-..."
              onChange={(event) => setApiKey(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model">model</Label>
            <ModelField value={model} dialogOpen={open} onChange={setModel} />
          </div>
        </div>
        {message ? (
          <p className={`text-sm ${messageIsError ? "text-destructive" : "text-muted-foreground"}`}>
            {message}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={testing} onClick={handleTest}>
            {testing ? "测试中" : "测试连接"}
          </Button>
          <Button type="button" onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
