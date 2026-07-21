export type ProviderErrorPayload = {
  message?: string;
  error?: string;
  errors?: unknown;
  detail?: string;
  [key: string]: unknown;
};

export async function readProviderJson<T>(response: Response, provider: string): Promise<T> {
  const text = await response.text();

  if (!text) {
    if (response.ok) return {} as T;
    throw new Error(`${provider} returned an empty response (${response.status}).`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const safeText = text.slice(0, 280).replace(/\s+/g, " ");
    throw new Error(`${provider} returned an unreadable response (${response.status}): ${safeText}`);
  }
}

export function providerMessage(payload: ProviderErrorPayload | undefined, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
  if (typeof payload.detail === "string" && payload.detail.trim()) return payload.detail;
  return fallback;
}

export function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  return (value || fallback).replace(/\/$/, "");
}

export function withTimeout(ms = 30_000): AbortSignal {
  return AbortSignal.timeout(ms);
}
