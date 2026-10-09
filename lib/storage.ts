import type { Evaluation } from "@/lib/types";

const HISTORY_KEY = "prompt-gym:history";
const SETTINGS_KEY = "prompt-gym:settings";

export const DEFAULT_BASE_URL = "https://api.deepseek.com";

export const MODEL_OPTIONS = [
  "deepseek-flash",
  "deepseek-chat",
  "qwen3.8-flash",
  "qwen-plus",
  "qwen-turbo",
  "glm-4-flash",
  "moonshot-v1-8k",
] as const;

export const DEFAULT_MODEL = MODEL_OPTIONS[0];

export type ApiSettings = {
  baseURL: string;
  apiKey: string;
  model: string;
};

function withDefaults(settings: Partial<ApiSettings>): ApiSettings {
  return {
    baseURL: settings.baseURL?.trim() || DEFAULT_BASE_URL,
    apiKey: settings.apiKey ?? "",
    model: settings.model?.trim() || DEFAULT_MODEL,
  };
}

export function readSettings(): ApiSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw === null) {
    return withDefaults({});
  }
  return withDefaults(JSON.parse(raw) as ApiSettings);
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
