import type {
  CriticalIssue,
  Dimension,
  Grade,
  PromptChange,
} from "@/lib/types";

export type CoachPayload = {
  totalScore: number;
  grade: Grade;
  summary: string;
  dimensions: Dimension[];
  criticalIssues: CriticalIssue[];
  failurePredictions: string[];
  improvedPrompt: string;
  changes: PromptChange[];
  nextStep: string;
};

export type ParseCoachResult =
  | { ok: true; data: CoachPayload }
  | { ok: false; kind: "json"; raw: string }
  | { ok: false; kind: "fields" };

const GRADES: readonly Grade[] = ["S", "A", "B", "C", "D", "F"];

function tryParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** 从原文中取出第一个完整的 JSON 对象，忽略字符串里的花括号。 */
function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }
    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDimension(value: unknown): value is Dimension {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.name === "string" &&
    typeof value.score === "number" &&
    typeof value.max === "number" &&
    typeof value.reason === "string"
  );
}

function isCriticalIssue(value: unknown): value is CriticalIssue {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.problem === "string" &&
    typeof value.consequence === "string" &&
    typeof value.fix === "string"
  );
}

function isPromptChange(value: unknown): value is PromptChange {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.point === "string" &&
    typeof value.before === "string" &&
    typeof value.after === "string" &&
    typeof value.benefit === "string"
  );
}

function isCoachPayload(value: unknown): value is CoachPayload {
  if (!isRecord(value)) {
    return false;
  }
  const grade = value.grade;
  return (
    typeof value.totalScore === "number" &&
    Number.isFinite(value.totalScore) &&
    typeof grade === "string" &&
    GRADES.includes(grade as Grade) &&
    typeof value.summary === "string" &&
    Array.isArray(value.dimensions) &&
    value.dimensions.length === 8 &&
    value.dimensions.every(isDimension) &&
    Array.isArray(value.criticalIssues) &&
    value.criticalIssues.every(isCriticalIssue) &&
    Array.isArray(value.failurePredictions) &&
    value.failurePredictions.every((item) => typeof item === "string") &&
    typeof value.improvedPrompt === "string" &&
    Array.isArray(value.changes) &&
    value.changes.every(isPromptChange) &&
    typeof value.nextStep === "string"
  );
}

export function parseCoachResponse(raw: string): ParseCoachResult {
  let parsed = tryParse(raw);
  if (parsed === null) {
    const extracted = extractJsonObject(raw);
    parsed = extracted === null ? null : tryParse(extracted);
  }
  if (parsed === null) {
    return { ok: false, kind: "json", raw };
  }
  if (!isCoachPayload(parsed)) {
    return { ok: false, kind: "fields" };
  }
  return { ok: true, data: parsed };
}
