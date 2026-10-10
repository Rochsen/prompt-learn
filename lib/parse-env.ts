import type { ApiSettings } from "@/lib/storage";

const FIELD_KEYS: Record<string, keyof ApiSettings> = {
  BASE_URL: "baseURL",
  API_KEY: "apiKey",
  MODEL: "model",
};

function stripQuotes(value: string): string {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/** 读取 .env 文本中的 BASE_URL、API_KEY、MODEL。空值不返回。 */
export function parseEnvConfig(text: string): Partial<ApiSettings> {
  const config: Partial<ApiSettings> = {};
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator < 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const field = FIELD_KEYS[key];
    if (!field) {
      continue;
    }
    const value = stripQuotes(trimmed.slice(separator + 1).trim());
    if (value) {
      config[field] = value;
    }
  }

  return config;
}
