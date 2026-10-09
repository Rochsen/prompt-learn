"use client";

import { useEffect, useState } from "react";

import { DimensionBars } from "@/components/DimensionBars";
import { ScoreRing } from "@/components/ScoreRing";
import { Button } from "@/components/ui/button";
import type { Evaluation, Grade } from "@/lib/types";

type ScorePanelProps = {
  evaluation: Evaluation;
};

const gradeClassName: Record<Grade, string> = {
  S: "bg-emerald-500/15 text-emerald-300",
  A: "bg-emerald-500/15 text-emerald-300",
  B: "bg-lime-500/15 text-lime-300",
  C: "bg-yellow-500/15 text-yellow-300",
  D: "bg-orange-500/15 text-orange-300",
  F: "bg-red-500/15 text-red-300",
};

export function ScorePanel({ evaluation }: ScorePanelProps) {
  const [copyLabel, setCopyLabel] = useState("复制");

  useEffect(() => {
    setCopyLabel("复制");
  }, [evaluation.id]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(evaluation.improvedPrompt);
      setCopyLabel("已复制");
    } catch {
      setCopyLabel("复制失败");
    }
    window.setTimeout(() => setCopyLabel("复制"), 1500);
  }

  return (
    <div className="flex flex-1 flex-col gap-8 overflow-y-auto px-6 py-5">
      <div className="flex items-center gap-5">
        <ScoreRing score={evaluation.totalScore} />
        <div className="min-w-0">
          <span
            className={`inline-flex h-6 items-center rounded-md px-2 text-xs font-medium ${gradeClassName[evaluation.grade]}`}
          >
            {evaluation.grade}
          </span>
          <p className="mt-2 text-sm leading-6">{evaluation.summary}</p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">维度得分</h2>
        <DimensionBars dimensions={evaluation.dimensions} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">最致命的扣分点</h2>
        <div className="flex flex-col gap-2">
          {evaluation.criticalIssues.map((issue) => (
            <article key={issue.problem} className="rounded-md border px-3 py-3">
              <p className="text-sm font-medium">{issue.problem}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                后果：{issue.consequence}
              </p>
              <p className="mt-1 text-sm leading-6">改法：{issue.fix}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">模型会怎么跑偏</h2>
        <ul className="flex flex-col gap-2">
          {evaluation.failurePredictions.map((prediction) => (
            <li key={prediction} className="text-sm leading-6 text-muted-foreground">
              {prediction}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">改进版提示词</h2>
          <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
            {copyLabel}
          </Button>
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-mono text-sm leading-6">
          {evaluation.improvedPrompt}
        </pre>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">改动说明</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-2 pr-3 font-medium">改动点</th>
                <th className="pb-2 pr-3 font-medium">之前</th>
                <th className="pb-2 pr-3 font-medium">之后</th>
                <th className="pb-2 font-medium">收益</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.changes.map((change) => (
                <tr key={change.point} className="border-t align-top">
                  <td className="py-2 pr-3">{change.point}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{change.before}</td>
                  <td className="py-2 pr-3">{change.after}</td>
                  <td className="py-2 text-muted-foreground">{change.benefit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">下一步</h2>
        <p className="text-sm leading-6 text-muted-foreground">{evaluation.nextStep}</p>
      </section>
    </div>
  );
}
