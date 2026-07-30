type TokenResponse = {
  access_token: string;
  expires_in_seconds?: number;
  credits_total?: number;
  credits_remaining?: number;
};

type EGovAiResponse = {
  data?: string;
  session_id?: string;
};

type CreditsResponse = {
  credits_total?: number;
  credits_used?: number;
  credits_remaining?: number;
  expires_at?: string;
};

type CachedToken = {
  value: string;
  expiresAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __ekalakalEgovAiToken: CachedToken | undefined;
}

function getConfig() {
  const baseUrl = (process.env.EGOV_AI_BASE_URL || "https://egov-ai-core-ws.oueg.info").replace(/\/$/, "");
  const accessCode = process.env.EGOV_AI_ACCESS_CODE;

  if (!accessCode) {
    throw new Error("EGOV_AI_ACCESS_CODE is missing.");
  }

  return { baseUrl, accessCode };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`eGov AI returned an unreadable response (${response.status}).`);
  }
}

export async function getEGovAiToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  const cached = globalThis.__ekalakalEgovAiToken;

  if (!forceRefresh && cached && cached.expiresAt > now + 60_000) {
    return cached.value;
  }

  const { baseUrl, accessCode } = getConfig();
  const response = await fetch(`${baseUrl}/api/v1/egov/integration/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_code: accessCode }),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });

  const payload = await readJson<TokenResponse & { message?: string }>(response);

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.message || `Unable to generate an eGov AI token (${response.status}).`);
  }

  const ttlSeconds = Math.max(payload.expires_in_seconds || 28_800, 120);
  globalThis.__ekalakalEgovAiToken = {
    value: payload.access_token,
    expiresAt: now + ttlSeconds * 1000,
  };

  return payload.access_token;
}

async function authenticatedFetch(path: string, init: RequestInit): Promise<Response> {
  const { baseUrl } = getConfig();
  let token = await getEGovAiToken();

  let response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
    signal: init.signal || AbortSignal.timeout(30_000),
  });

  if (response.status === 401) {
    token = await getEGovAiToken(true);
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
      signal: init.signal || AbortSignal.timeout(30_000),
    });
  }

  return response;
}

export async function askEGovAi(prompt: string): Promise<{ answer: string; sessionId: string | null }> {
  const response = await authenticatedFetch("/api/v1/egov/integration/ai_assistant/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, category: "PH" }),
  });

  const payload = await readJson<EGovAiResponse & { message?: string }>(response);

  if (!response.ok || !payload.data) {
    throw new Error(payload.message || `eGov AI could not answer the request (${response.status}).`);
  }

  const cleanAnswer = payload.data
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\*\*(.*?)\*\*/g, '$1 :')
    .trim();

  return {
    answer: cleanAnswer,
    sessionId: payload.session_id || null,
  };
}

export async function getEGovAiCredits(): Promise<CreditsResponse> {
  const response = await authenticatedFetch("/api/v1/egov/integration/credits", {
    method: "GET",
  });

  const payload = await readJson<CreditsResponse & { message?: string }>(response);

  if (!response.ok) {
    throw new Error(payload.message || `Unable to retrieve token credits (${response.status}).`);
  }

  return payload;
}
