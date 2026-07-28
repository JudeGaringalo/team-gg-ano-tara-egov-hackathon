import { normalizeBaseUrl, providerMessage, readProviderJson, withTimeout } from "./provider-http";

type SessionResponse = { token?: string; url?: string; message?: string; error?: string };
type ResultResponse = { status?: string; confidence_score?: number; reference_image_url?: string; message?: string; error?: string };

function config() {
  const baseUrl = normalizeBaseUrl(process.env.FACE_LIVENESS_BASE_URL, "https://hackathon-face-liveness.e.gov.ph");
  const apiKey = process.env.FACE_LIVENESS_API_KEY;
  if (!apiKey) throw new Error("Face Liveness API key is missing.");
  return { baseUrl, apiKey };
}

export async function createCloseLivenessSession() {
  const { baseUrl, apiKey } = config();
  const response = await fetch(`${baseUrl}/v1/liveness/session`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "close", delay: 1200 }),
    cache: "no-store",
    signal: withTimeout(),
  });
  const payload = await readProviderJson<SessionResponse>(response, "Face Liveness");
  if (!response.ok || !payload.token || !payload.url) {
    throw new Error(providerMessage(payload, `Face Liveness could not create a close session (${response.status}).`));
  }
  return { token: payload.token, url: payload.url };
}

export async function createLivenessSession(callbackUrl: string) {
  const { baseUrl, apiKey } = config();
  const response = await fetch(`${baseUrl}/v1/liveness/session`, {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "redirect", callback_url: callbackUrl, delay: 1200 }),
    cache: "no-store",
    signal: withTimeout(),
  });
  const payload = await readProviderJson<SessionResponse>(response, "Face Liveness");
  if (!response.ok || !payload.token || !payload.url) {
    throw new Error(providerMessage(payload, `Face Liveness could not create a session (${response.status}).`));
  }
  return { token: payload.token, url: payload.url };
}

export async function getLivenessResult(token: string) {
  const { baseUrl, apiKey } = config();
  const response = await fetch(`${baseUrl}/v1/liveness/result/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: { "x-api-key": apiKey },
    cache: "no-store",
    signal: withTimeout(),
  });
  const payload = await readProviderJson<ResultResponse>(response, "Face Liveness");
  if (!response.ok) {
    throw new Error(providerMessage(payload, `Face Liveness could not retrieve the result (${response.status}).`));
  }
  return payload;
}
