import { createHmac } from "node:crypto";
import { normalizeBaseUrl, providerMessage, readProviderJson, withTimeout } from "./provider-http";

export type EGovPayTransaction = {
  uuid?: string;
  url?: string;
  channel?: { refno?: string; [key: string]: unknown };
  [key: string]: unknown;
};

type TransactionResponse = { data?: EGovPayTransaction; message?: string; error?: string; errors?: unknown; error_description?: string };

function config() {
  const baseUrl = normalizeBaseUrl(process.env.EGOV_PAY_BASE_URL, "https://egovpay-pgi-dev.oueg.info");
  const apiKey = process.env.EGOV_PAY_API_KEY;
  const settlementTemplateUuid = process.env.EGOV_PAY_SETTLEMENT_TEMPLATE_UUID;
  if (!apiKey || !settlementTemplateUuid) throw new Error("eGovPay credentials are missing.");
  const hmacKey = apiKey.replace(/^test_/, "");
  return { baseUrl, apiKey, hmacKey, settlementTemplateUuid };
}

export async function createEGovPayCollection(input: {
  amount: number;
  txnid: string;
  redirectUrl: string;
  callbackUrl: string;
  mobile?: string;
  email?: string;
  name?: string;
  description?: Record<string, unknown>;
  digestOverride?: string;
}): Promise<EGovPayTransaction> {
  const { baseUrl, apiKey, hmacKey, settlementTemplateUuid } = config();
  const amount = Number(input.amount.toFixed(2));
  const amountStr = amount.toFixed(2);
  const digestSeed = `${amountStr}|${input.txnid}`;
  const digest = input.digestOverride || createHmac("sha256", hmacKey).update(digestSeed).digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");

  console.debug("[eGovPay] digest seed:", digestSeed, "digest:", digest);

  const body: Record<string, unknown> = {
    amount,
    settlement_template_uuid: settlementTemplateUuid,
    currency: "PHP",
    digest,
    expires_at: expires,
    link_expires_at: expires,
    callback_url: input.callbackUrl,
    redirect_url: input.redirectUrl,
    txnid: input.txnid,
    description: input.description || { purpose: "Trash2Cash transaction" },
    items: [{ name: "Trash2Cash transaction", amount }],
  };
  if (input.mobile) body.mobile = input.mobile;
  if (input.email) body.email = input.email;
  if (input.name) body.name = input.name;

  const response = await fetch(`${baseUrl}/api/v1/transaction`, {
    method: "POST",
    headers: { "X-eGovPay-Token": apiKey, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: withTimeout(),
  });
  const payload = await readProviderJson<TransactionResponse>(response, "eGovPay");
  if (!response.ok || !payload.data) {
    const detail = payload?.errors ? ` — ${JSON.stringify(payload.errors)}` : "";
    throw new Error(providerMessage(payload, `eGovPay could not create the transaction (${response.status}).`) + detail);
  }
  return payload.data;
}

export async function getEGovPayTransaction(uuid: string): Promise<EGovPayTransaction> {
  const { baseUrl, apiKey } = config();
  const response = await fetch(`${baseUrl}/api/v1/transaction/${encodeURIComponent(uuid)}`, {
    method: "GET",
    headers: { "X-eGovPay-Token": apiKey, "Content-Type": "application/json; charset=utf-8" },
    cache: "no-store",
    signal: withTimeout(),
  });
  const payload = await readProviderJson<TransactionResponse>(response, "eGovPay");
  if (!response.ok || !payload.data) {
    const detail = payload?.errors ? ` — ${JSON.stringify(payload.errors)}` : "";
    throw new Error(providerMessage(payload, `eGovPay could not retrieve the transaction (${response.status}).`) + detail);
  }
  return payload.data;
}
