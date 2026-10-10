import type { Evaluation } from "@/lib/types";

const HISTORY_KEY = "prompt-gym:history";
const SETTINGS_KEY = "prompt-gym:settings";

export const MODEL_OPTIONS = [
  "deepseek-flash",
  "deepseek-chat",
  "qwen3.8-flash",
  "qwen-plus",
  "qwen-turbo",
  "glm-4-flash",
  "moonshot-v1-8k",
] as const;

export type ApiSettings = {
  baseURL: string;
  apiKey: string;
  model: string;
};

function emptySettings(): ApiSettings {
  return {
    baseURL: "",
    apiKey: "",
    model: "",
  };
}

export function readSettings(): ApiSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw === null) {
    return emptySettings();
  }
  const parsed = JSON.parse(raw) as Partial<ApiSettings>;
  return {
    baseURL: parsed.baseURL ?? "",
    apiKey: parsed.apiKey ?? "",
    model: parsed.model ?? "",
  };
}

export function writeSettings(settings: ApiSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

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
