"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { buildHistoryChains } from "@/lib/history";
import type { Evaluation } from "@/lib/types";

type HistoryDrawerProps = {
  open: boolean;
  evaluations: Evaluation[];
  selectedId: string | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
};

function formatTime(createdAt: number): string {
  return new Date(createdAt).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryDrawer({
  open,
  evaluations,
  selectedId,
  onOpenChange,
  onSelect,
  onDelete,
  onClear,
}: HistoryDrawerProps) {
  const nodes = buildHistoryChains(evaluations);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>历史记录</SheetTitle>
          <SheetDescription>按最近一次迭代排列，点击后加载到右侧。</SheetDescription>
        </SheetHeader>

        {nodes.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">暂无历史记录</p>
        ) : (
          <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {nodes.map((node) => {
              const { evaluation, depth } = node;
              const selected = evaluation.id === selectedId;
              return (
                <li
                  key={evaluation.id}
                  className={depth > 0 ? "border-l border-border" : undefined}
                  style={{ marginLeft: depth * 14 }}
                >
                  <div
                    className={`flex items-start gap-1 rounded-md pr-1 transition-colors ${
                      selected ? "bg-accent" : "hover:bg-accent/60"
                    }`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 px-3 py-2 text-left"
                      onClick={() => onSelect(evaluation.id)}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium tabular-nums">
                          {evaluation.totalScore}
                        </span>
                        <span className="text-xs text-muted-foreground">{evaluation.grade}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatTime(evaluation.createdAt)}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                        {evaluation.promptText.slice(0, 40)}
                      </span>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 shrink-0 text-muted-foreground"
                      onClick={() => onDelete(evaluation.id)}
                    >
                      删除
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          className="mt-4"
          disabled={evaluations.length === 0}
          onClick={onClear}
        >
          清空全部
        </Button>
      </SheetContent>
    </Sheet>
  );
}
