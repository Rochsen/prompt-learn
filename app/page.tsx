"use client";

import { useEffect, useState } from "react";

import { HistoryDrawer } from "@/components/HistoryDrawer";
import { ScorePanel } from "@/components/ScorePanel";
import { ScoreSkeleton } from "@/components/ScoreSkeleton";
import { SettingsDialog } from "@/components/SettingsDialog";
import { TaskContextField } from "@/components/TaskContextField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRequestError, requestCoachReply } from "@/lib/evaluate";
import { MOCK_EVALUATIONS } from "@/lib/mock-evaluations";
import { parseCoachResponse } from "@/lib/parseCoachResponse";
import { readEvaluations, readSettings, writeEvaluations } from "@/lib/storage";
import type { Evaluation } from "@/lib/types";

function latestEvaluation(items: Evaluation[]): Evaluation | undefined {
  return [...items].sort((a, b) => b.createdAt - a.createdAt)[0];
}

export default function HomePage() {
  const [promptText, setPromptText] = useState("");
  const [taskContext, setTaskContext] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [rawResponse, setRawResponse] = useState("");
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
    setRawResponse("");
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

  async function handleScore() {
    const prompt = promptText.trim();
    if (!prompt || scoring) {
      return;
    }
    const settings = readSettings();
    if (!settings.apiKey.trim()) {
      setScoreError("请先在设置中填写 API Key");
      setSettingsOpen(true);
      return;
    }
    if (!settings.baseURL.trim() || !settings.model.trim()) {
      setScoreError("请先在设置中填写 baseURL 和 model");
      setSettingsOpen(true);
      return;
    }

    setScoring(true);
    setScoreError("");
    setRawResponse("");
    try {
      const raw = await requestCoachReply(settings, prompt, taskContext);
      const parsed = parseCoachResponse(raw);
      if (!parsed.ok) {
        setScoreError(
          parsed.kind === "json" ? "评分结果无法解析，请重试" : "评分结果字段不完整，请重试"
        );
        setRawResponse(parsed.raw);
        return;
      }
      const context = taskContext.trim();
      const evaluation: Evaluation = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        promptText: prompt,
        ...(context ? { taskContext: context } : {}),
        ...parsed.data,
      };
      const next = [evaluation, ...history];
      writeEvaluations(next);
      setHistory(next);
      setSelectedId(evaluation.id);
    } catch (error) {
      setScoreError(formatRequestError(error));
    } finally {
      setScoring(false);
    }
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
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    void handleScore();
                  }
                }}
                placeholder="写下要评分的提示词"
                rows={10}
                className="min-h-56 resize-y font-sans"
              />
            </div>

            <TaskContextField
              open={contextOpen}
              value={taskContext}
              onOpenChange={setContextOpen}
              onChange={setTaskContext}
            />

            <Button type="button" disabled={!canScore || scoring} onClick={() => void handleScore()}>
              {scoring ? "评分中" : "开始评分"}
            </Button>
            {scoreError ? <p className="text-sm text-destructive">{scoreError}</p> : null}
          </div>
        </section>

        <section className="flex w-3/5 min-w-0 flex-col">
          {scoring ? (
            <ScoreSkeleton />
          ) : rawResponse ? (
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
              <h2 className="text-sm font-medium">模型原文</h2>
              <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-mono text-sm leading-6">
                {rawResponse}
              </pre>
            </div>
          ) : selected ? (
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

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

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
