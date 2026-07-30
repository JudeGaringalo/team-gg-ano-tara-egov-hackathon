import { normalizeBaseUrl, providerMessage, readProviderJson, withTimeout } from "./provider-http";

type CachedToken = { value: string; expiresAt: number };
declare global {
  // eslint-disable-next-line no-var
  var __ekalakalEverifyToken: CachedToken | undefined;
}

type AuthResponse = {
  data?: { access_token?: string; expires_at?: string | number; token_type?: string };
  access_token?: string;
  message?: string;
  error?: string;
};

export type EVerifyProfile = {
  code?: string;
  token?: string;
  reference?: string;
  face_url?: string;
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string | null;
  gender?: string;
  marital_status?: string;
  blood_type?: string;
  email?: string;
  mobile_number?: string;
  birth_date?: string;
  full_address?: string;
  address_line_1?: string;
  [key: string]: unknown;
};

type VerifyResponse = { data?: EVerifyProfile; message?: string; error?: string; meta?: unknown };

function config() {
  const baseUrl = normalizeBaseUrl(process.env.EVERIFY_BASE_URL, "https://hackathon-everify.e.gov.ph");
  const clientId = process.env.EVERIFY_CLIENT_ID;
  const clientSecret = process.env.EVERIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("National ID e-Verify credentials are missing.");
  return { baseUrl, clientId, clientSecret };
}

function parseExpiry(value: string | number | undefined): number {
  if (typeof value === "number") {
    return value > 10_000_000_000 ? value : value * 1000;
  }
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric > 10_000_000_000 ? numeric : numeric * 1000;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now() + 50 * 60 * 1000;
}

export async function getEVerifyToken(forceRefresh = false): Promise<string> {
  const cached = globalThis.__ekalakalEverifyToken;
  if (!forceRefresh && cached && cached.expiresAt > Date.now() + 60_000) return cached.value;

  const { baseUrl, clientId, clientSecret } = config();
  const response = await fetch(`${baseUrl}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    cache: "no-store",
    signal: withTimeout(),
  });
  const payload = await readProviderJson<AuthResponse>(response, "National ID e-Verify");
  const token = payload.data?.access_token || payload.access_token;
  if (!response.ok || !token) {
    throw new Error(providerMessage(payload, `National ID e-Verify authentication failed (${response.status}).`));
  }

  globalThis.__ekalakalEverifyToken = {
    value: token,
    expiresAt: parseExpiry(payload.data?.expires_at),
  };
  return token;
}

async function callEVerify(path: string, body: Record<string, unknown>): Promise<EVerifyProfile> {
  const { baseUrl } = config();
  let token = await getEVerifyToken();
  let response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: withTimeout(45_000),
  });

  if (response.status === 401) {
    token = await getEVerifyToken(true);
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: withTimeout(45_000),
    });
  }

  const payload = await readProviderJson<VerifyResponse>(response, "National ID e-Verify");
  if (!response.ok || !payload.data) {
    throw new Error(providerMessage(payload, `National ID e-Verify request failed (${response.status}).`));
  }
  return payload.data;
}

export function checkNationalIdQr(value: string) {
  return callEVerify("/api/query/qr/check", { value });
}

export function verifyNationalIdQr(value: string, faceLivenessSessionId: string) {
  return callEVerify("/api/query/qr", {
    value,
    face_liveness_session_id: faceLivenessSessionId,
  });
}

