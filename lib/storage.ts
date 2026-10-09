import type { Evaluation } from "@/lib/types";

const HISTORY_KEY = "prompt-gym:history";

export function readEvaluations(): Evaluation[] | null {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (raw === null) {
    return null;
  }
  return JSON.parse(raw) as Evaluation[];
}

export function writeEvaluations(items: Evaluation[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}
