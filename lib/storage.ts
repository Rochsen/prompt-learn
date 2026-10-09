import type { Evaluation } from "@/lib/types";

const HISTORY_KEY = "prompt-gym:history";
const SETTINGS_KEY = "prompt-gym:settings";

export type ApiSettings = {
  baseURL: string;
  apiKey: string;
  model: string;
};

const EMPTY_SETTINGS: ApiSettings = {
  baseURL: "",
  apiKey: "",
  model: "",
};

export function readSettings(): ApiSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (raw === null) {
    return EMPTY_SETTINGS;
  }
  return JSON.parse(raw) as ApiSettings;
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
