"use client";

import { useEffect, useState } from "react";

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
import { readSettings, writeSettings } from "@/lib/storage";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [baseURL, setBaseURL] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
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
              placeholder="https://api.openai.com/v1"
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
            <Input
              id="model"
              value={model}
              placeholder="gpt-4o-mini"
              onChange={(event) => setModel(event.target.value)}
            />
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
