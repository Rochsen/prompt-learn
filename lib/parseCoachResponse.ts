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
  | { ok: false; kind: "fields"; raw: string };

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

const DIMENSION_MAX: Record<string, number> = {
  目标与任务清晰度: 15,
  背景与上下文: 12,
  角色与受众: 10,
  约束与边界: 13,
  输出格式: 12,
  示例与风格锚定: 10,
  任务拆解与过程控制: 13,
  精确性与无冲突: 15,
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function asText(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function pick(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
}

function gradeFromScore(totalScore: number): Grade {
  if (totalScore >= 90) {
    return "S";
  }
  if (totalScore >= 80) {
    return "A";
  }
  if (totalScore >= 70) {
    return "B";
  }
  if (totalScore >= 60) {
    return "C";
  }
  if (totalScore >= 40) {
    return "D";
  }
  return "F";
}

function normalizeGrade(value: unknown, totalScore: number): Grade {
  if (typeof value === "string") {
    const token = value.trim().toUpperCase().replace(/级/g, "");
    if (token.length === 1 && GRADES.includes(token as Grade)) {
      return token as Grade;
    }
  }
  return gradeFromScore(totalScore);
}

function maxForDimension(name: string): number | null {
  const compact = name.replace(/\s/g, "");
  if (DIMENSION_MAX[compact] !== undefined) {
    return DIMENSION_MAX[compact];
  }
  const matched = Object.keys(DIMENSION_MAX).find((key) => compact.includes(key));
  return matched ? DIMENSION_MAX[matched] : null;
}

function normalizeDimension(value: unknown, fallbackName?: string): Dimension | null {
  if (!isRecord(value) && fallbackName === undefined) {
    return null;
  }
  const record = isRecord(value) ? value : {};
  const name = asText(pick(record, ["name", "dimension", "title", "维度"])) ?? fallbackName;
  if (!name) {
    return null;
  }
  const score = asNumber(pick(record, ["score", "得分", "value"]));
  if (score === null) {
    return null;
  }
  const max = asNumber(pick(record, ["max", "maxScore", "full", "满分", "total"])) ?? maxForDimension(name);
  if (max === null) {
    return null;
  }
  const reason = asText(pick(record, ["reason", "comment", "deduction", "原因", "扣分原因"])) ?? "";
  return { name, score, max, reason };
}

function normalizeDimensions(value: unknown): Dimension[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const dimension = normalizeDimension(item);
      return dimension ? [dimension] : [];
    });
  }
  if (!isRecord(value)) {
    return [];
  }
  return Object.entries(value).flatMap(([key, item]) => {
    const dimension = isRecord(item)
      ? normalizeDimension({ name: key, ...item })
      : normalizeDimension({ name: key, score: item }, key);
    return dimension ? [dimension] : [];
  });
}

function normalizeIssue(value: unknown): CriticalIssue | null {
  if (typeof value === "string" && value.trim()) {
    return { problem: value, consequence: "", fix: "" };
  }
  if (!isRecord(value)) {
    return null;
  }
  const problem = asText(pick(value, ["problem", "issue", "title", "问题"]));
  if (!problem) {
    return null;
  }
  return {
    problem,
    consequence: asText(pick(value, ["consequence", "impact", "result", "后果"])) ?? "",
    fix: asText(pick(value, ["fix", "suggestion", "solution", "改法"])) ?? "",
  };
}

function normalizeChange(value: unknown): PromptChange | null {
  if (!isRecord(value)) {
    return null;
  }
  const point = asText(pick(value, ["point", "change", "title", "改动点"]));
  if (!point) {
    return null;
  }
  return {
    point,
    before: asText(pick(value, ["before", "from", "之前"])) ?? "",
    after: asText(pick(value, ["after", "to", "之后"])) ?? "",
    benefit: asText(pick(value, ["benefit", "why", "收益"])) ?? "",
  };
}

function normalizePredictions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const text = asText(value);
    return text ? [text] : [];
  }
  return value.flatMap((item) => {
    const text = asText(item);
    if (text) {
      return [text];
    }
    if (isRecord(item)) {
      const joined = asText(pick(item, ["text", "prediction", "content", "描述"]));
      return joined ? [joined] : [];
    }
    return [];
  });
}

function unwrapPayload(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    const parsed = tryParse(value);
    return parsed === null ? null : unwrapPayload(parsed);
  }
  if (!isRecord(value)) {
    return null;
  }
  const score = pick(value, ["totalScore", "total_score", "score", "总分"]);
  const dimensions = pick(value, ["dimensions", "dimension_scores", "scores", "维度"]);
  if (score !== undefined || dimensions !== undefined) {
    return value;
  }
  for (const key of ["result", "data", "evaluation", "output", "json"]) {
    if (value[key] !== undefined) {
      const inner = unwrapPayload(value[key]);
      if (inner) {
        return inner;
      }
    }
  }
  return null;
}

/** 把模型常见的别名、字符串数字和缺省字段整理成页面需要的结构。 */
function normalizeCoachPayload(value: unknown): CoachPayload | null {
  const record = unwrapPayload(value);
  if (!record) {
    return null;
  }
  const dimensions = normalizeDimensions(
    pick(record, ["dimensions", "dimension_scores", "scores", "维度"])
  );
  const totalFromDimensions = dimensions.reduce((sum, item) => sum + item.score, 0);
  const totalScore = asNumber(pick(record, ["totalScore", "total_score", "score", "总分"])) ?? totalFromDimensions;
  if (!Number.isFinite(totalScore) || dimensions.length === 0) {
    return null;
  }
  const issues = pick(record, ["criticalIssues", "critical_issues", "issues", "扣分点"]);
  const changes = pick(record, ["changes", "changeList", "change_list", "改动"]);
  return {
    totalScore,
    grade: normalizeGrade(pick(record, ["grade", "level", "等级"]), totalScore),
    summary: asText(pick(record, ["summary", "comment", "总评", "总结"])) ?? "",
    dimensions,
    criticalIssues: Array.isArray(issues)
      ? issues.flatMap((item) => {
          const issue = normalizeIssue(item);
          return issue ? [issue] : [];
        })
      : [],
    failurePredictions: normalizePredictions(
      pick(record, ["failurePredictions", "failure_predictions", "predictions", "跑偏"])
    ),
    improvedPrompt: asText(pick(record, ["improvedPrompt", "improved_prompt", "rewrite", "改进提示词"])) ?? "",
    changes: Array.isArray(changes)
      ? changes.flatMap((item) => {
          const change = normalizeChange(item);
          return change ? [change] : [];
        })
      : [],
    nextStep: asText(pick(record, ["nextStep", "next_step", "suggestion", "下一步"])) ?? "",
  };
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
  if (typeof parsed === "string") {
    parsed = tryParse(parsed);
  }
  if (parsed === null) {
    return { ok: false, kind: "json", raw };
  }
  if (isCoachPayload(parsed)) {
    return { ok: true, data: parsed };
  }
  const normalized = normalizeCoachPayload(parsed);
  if (!normalized) {
    return { ok: false, kind: "fields", raw };
  }
  return { ok: true, data: normalized };
}
