import { PROMPT_COACH_SYSTEM_PROMPT } from "@/lib/promptCoach";
import type { ApiSettings } from "@/lib/storage";

const REQUEST_TIMEOUT_MS = 60_000;

export function formatRequestError(error: unknown): string {
  if (
    error instanceof DOMException &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  ) {
    return "请求超时，请稍后重试";
  }
  if (error instanceof TypeError) {
    return "网络请求失败，请检查 baseURL 或网络";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "网络请求失败";
}

function normalizeBaseURL(baseURL: string): string {
  return baseURL.trim().replace(/\/+$/, "");
}

function buildUserMessage(promptText: string, taskContext: string): string {
  const prompt = promptText.trim();
  const context = taskContext.trim();
  if (!context) {
    return prompt;
  }
  return `提示词：\n${prompt}\n\n任务背景：\n${context}`;
}

async function readErrorDetail(response: Response): Promise<string> {
  const detail = (await response.text()).trim();
  if (!detail) {
    return `接口返回 ${response.status}`;
  }
  return `接口返回 ${response.status}：${detail.slice(0, 300)}`;
}

export async function testConnection(settings: ApiSettings): Promise<void> {
  const baseURL = normalizeBaseURL(settings.baseURL);
  const response = await fetch(`${baseURL}/models`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(await readErrorDetail(response));
  }
}

export async function requestCoachReply(
  settings: ApiSettings,
  promptText: string,
  taskContext: string
): Promise<string> {
  const baseURL = normalizeBaseURL(settings.baseURL);
  const response = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: settings.model.trim(),
      messages: [
        { role: "system", content: PROMPT_COACH_SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(promptText, taskContext) },
      ],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(await readErrorDetail(response));
  }

  const body = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new Error("接口没有返回评分内容");
  }
  return content;
}
