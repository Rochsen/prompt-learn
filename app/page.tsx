"use client";

import { useEffect, useState } from "react";

import { HistoryDrawer } from "@/components/HistoryDrawer";
import { ScorePanel } from "@/components/ScorePanel";
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
import { Textarea } from "@/components/ui/textarea";
import { MOCK_EVALUATIONS } from "@/lib/mock-evaluations";
import { readEvaluations, writeEvaluations } from "@/lib/storage";
import type { Evaluation } from "@/lib/types";

function latestEvaluation(items: Evaluation[]): Evaluation | undefined {
  return [...items].sort((a, b) => b.createdAt - a.createdAt)[0];
}

export default function HomePage() {
  const [promptText, setPromptText] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Evaluation[]>(MOCK_EVALUATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(
    latestEvaluation(MOCK_EVALUATIONS)?.id ?? null
  );
  const canScore = promptText.trim().length > 0;
  const selected = history.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    const stored = readEvaluations();
    if (stored === null) {
      writeEvaluations(MOCK_EVALUATIONS);
      return;
    }
    setHistory(stored);
    setSelectedId(latestEvaluation(stored)?.id ?? null);
  }, []);

  function handleSelect(id: string) {
    setSelectedId(id);
    setHistoryOpen(false);
  }

  function handleDelete(id: string) {
    const next = history.filter((item) => item.id !== id);
    writeEvaluations(next);
    setHistory(next);
    if (selectedId === id) {
      setSelectedId(latestEvaluation(next)?.id ?? null);
    }
  }

  function handleClear() {
    writeEvaluations([]);
    setHistory([]);
    setSelectedId(null);
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <span className="text-sm font-semibold tracking-tight">Prompt Gym</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            设置
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
          >
            历史记录
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex w-2/5 min-w-0 flex-col border-r">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="prompt">提示词</Label>
              <Textarea
                id="prompt"
                value={promptText}
                onChange={(event) => setPromptText(event.target.value)}
                placeholder="写下要评分的提示词"
                rows={10}
                className="min-h-56 resize-y font-sans"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-fit px-2 text-muted-foreground"
                onClick={() => setContextOpen((open) => !open)}
              >
                {contextOpen ? "收起任务背景" : "任务背景（可选）"}
              </Button>
              {contextOpen ? (
                <Textarea
                  id="task-context"
                  placeholder="补充任务背景，帮助判断提示词是否够用"
                  rows={4}
                  className="resize-y"
                />
              ) : null}
            </div>

            <Button type="button" disabled={!canScore}>
              开始评分
            </Button>
          </div>
        </section>

        <section className="flex w-3/5 min-w-0 flex-col">
          {selected ? (
            <ScorePanel evaluation={selected} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="max-w-sm text-center">
                <p className="text-sm font-medium">评分结果</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  分数、维度、问题诊断和改进版本会显示在这里。
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API 配置</DialogTitle>
            <DialogDescription>
              填写 OpenAI 兼容接口。此步骤只展示表单，不会保存或发起请求。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="base-url">baseURL</Label>
              <Input id="base-url" placeholder="https://api.openai.com/v1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-key">apiKey</Label>
              <Input id="api-key" type="password" placeholder="sk-..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model">model</Label>
              <Input id="model" placeholder="gpt-4o-mini" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline">
              测试连接
            </Button>
            <Button type="button">保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HistoryDrawer
        open={historyOpen}
        evaluations={history}
        selectedId={selectedId}
        onOpenChange={setHistoryOpen}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onClear={handleClear}
      />
    </div>
  );
}
