import { normalizeBaseUrl, providerMessage, readProviderJson, withTimeout } from "./provider-http";

export type EGovProfile = {
  uniqid?: string;
  email?: string;
  birth_date?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string | null;
  gender?: string;
  nationality?: string;
  photo?: string;
  mobile?: string;
  address?: string;
  street?: string;
  barangay?: string;
  municipality?: string;
  region?: string;
  province?: string;
  country?: string;
  postal?: string | number;
  address_line_2?: string;
  barangay_code?: string;
  province_code?: string;
  municipality_code?: string;
  region_code?: string;
  country_id?: string | number;
  foreign_address?: string;
  [key: string]: unknown;
};

type TokenResponse = { access_token?: string; message?: string; error?: string };
type ProfileResponse = { status?: number; message?: string; data?: EGovProfile; error?: string };

function config() {
  const baseUrl = normalizeBaseUrl(process.env.EGOV_SSO_BASE_URL, "https://stg-superapp-sso.oueg.info");
  const partnerCode = process.env.EGOV_SSO_PARTNER_CODE;
  const partnerSecret = process.env.EGOV_SSO_PARTNER_SECRET;
  if (!partnerCode || !partnerSecret) throw new Error("eGov SSO credentials are missing.");
  return { baseUrl, partnerCode, partnerSecret };
}

async function requestTokenWithBody(exchangeCode: string, contentType: "json" | "form"): Promise<Response> {
  const { baseUrl, partnerCode, partnerSecret } = config();
  const fields = {
    exchange_code: exchangeCode,
    scope: "SSO_AUTHENTICATION",
    partner_code: partnerCode,
    partner_secret: partnerSecret,
  };

  if (contentType === "form") {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, value));
    return fetch(`${baseUrl}/api/token`, {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: withTimeout(),
    });
  }

  return fetch(`${baseUrl}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
    cache: "no-store",
    signal: withTimeout(),
  });
}

export async function authenticateWithEGovSSO(exchangeCode: string): Promise<EGovProfile> {
  if (!exchangeCode.trim()) throw new Error("The eGovPH exchange code is missing.");

  let tokenResponse = await requestTokenWithBody(exchangeCode.trim(), "json");
  if (!tokenResponse.ok && [400, 415, 422].includes(tokenResponse.status)) {
    tokenResponse = await requestTokenWithBody(exchangeCode.trim(), "form");
  }

  const tokenPayload = await readProviderJson<TokenResponse>(tokenResponse, "eGov SSO");
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(providerMessage(tokenPayload, `eGov SSO could not exchange the code (${tokenResponse.status}).`));
  }

  const { baseUrl } = config();
  const profileResponse = await fetch(`${baseUrl}/api/partner/sso_authentication`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    cache: "no-store",
    signal: withTimeout(),
  });

  const profilePayload = await readProviderJson<ProfileResponse>(profileResponse, "eGov SSO");
  if (!profileResponse.ok || !profilePayload.data) {
    throw new Error(providerMessage(profilePayload, `eGov SSO could not retrieve the citizen profile (${profileResponse.status}).`));
  }

  return profilePayload.data;
}
