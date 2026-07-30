import { normalizeBaseUrl, providerMessage, readProviderJson, withTimeout } from "./provider-http";

type TokenResponse = { access_token?: string; expires_at?: string; message?: string; error?: string };
type CachedToken = { value: string; expiresAt: number; baseUrl: string };
declare global {
  // eslint-disable-next-line no-var
  var __trash2cashEreportToken: CachedToken | undefined;
}

export type EReportComplaintInput = {
  mobile: string;
  first_name: string;
  last_name: string;
  gender: string;
  complainant_email: string;
  report_type: string;
  subject: string;
  message: string;
  evidences: string[];
  region_code: string;
  province_code: string;
  municipality_code: string;
  barangay_code: string;
  latitude?: string;
  longitude?: string;
};

type ComplaintResponse = { code?: number; message?: string; case_number?: string; error?: string };

function config() {
  const baseUrl = normalizeBaseUrl(process.env.EREPORT_BASE_URL, "https://report.e.gov.ph");
  const staticToken = process.env.EREPORT_ACCESS_TOKEN;
  const accessCode = process.env.EREPORT_ACCESS_CODE;
  if (!staticToken && !accessCode) throw new Error("eReport access credential is missing.");
  console.error("[ereport] config:", { baseUrl, hasStaticToken: !!staticToken, hasAccessCode: !!accessCode });
  return { baseUrl, staticToken, accessCode };
}

async function getToken(): Promise<string> {
  const { baseUrl, staticToken, accessCode } = config();
  if (staticToken) {
    console.error("[ereport] using static token");
    return staticToken;
  }

  const cached = globalThis.__trash2cashEreportToken;
  if (cached && cached.baseUrl === baseUrl && cached.expiresAt > Date.now() + 60_000) {
    console.error("[ereport] using cached token for", cached.baseUrl, "expires at", new Date(cached.expiresAt).toISOString());
    return cached.value;
  }

  console.error("[ereport] fetching fresh token from", `${baseUrl}/api/integration/token`);
  const response = await fetch(`${baseUrl}/api/integration/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_code: accessCode }),
    cache: "no-store",
    signal: withTimeout(),
  });
  const payload = await readProviderJson<TokenResponse>(response, "eReport");
  console.error("[ereport] token response:", { status: response.status, payload });
  if (!response.ok || !payload.access_token) {
    throw new Error(providerMessage(payload, `eReport could not generate an integration token (${response.status}).`));
  }
  globalThis.__trash2cashEreportToken = {
    value: payload.access_token,
    expiresAt: payload.expires_at ? Date.parse(payload.expires_at) : Date.now() + 50 * 60 * 1000,
    baseUrl,
  };
  console.error("[ereport] token cached, expires at", payload.expires_at);
  return payload.access_token;
}

export async function submitEReportComplaint(input: EReportComplaintInput): Promise<ComplaintResponse> {
  const { baseUrl } = config();
  const token = await getToken();
  console.error("[ereport] submitting complaint to", `${baseUrl}/api/integration/submit_complaint`);
  const response = await fetch(`${baseUrl}/api/integration/submit_complaint`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
    signal: withTimeout(45_000),
  });
  const payload = await readProviderJson<ComplaintResponse>(response, "eReport");
  console.error("[ereport] submit response:", { status: response.status, payload });
  if (!response.ok || (!payload.case_number && payload.code !== 200)) {
    throw new Error(providerMessage(payload, `eReport could not submit the report (${response.status}).`));
  }
  return payload;
}
