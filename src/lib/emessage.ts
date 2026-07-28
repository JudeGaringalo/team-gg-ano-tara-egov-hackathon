import { normalizeBaseUrl, providerMessage, readProviderJson, withTimeout } from "./provider-http";

type EMessageResponse = { data?: { message?: string }; message?: string; error?: string };

export async function sendEMessageSms(number: string, message: string): Promise<string> {
  const baseUrl = normalizeBaseUrl(process.env.EMESSAGE_BASE_URL, "https://ws-v2.txtbox.com");
  const token = process.env.EMESSAGE_ACCESS_TOKEN;
  if (!token) throw new Error("eMessage access token is missing.");
  if (!/^\+\d{10,15}$/.test(number)) throw new Error("The mobile number must use E.164 format, such as +639274542237.");

  const response = await fetch(`${baseUrl}/messaging/v1/sms/push`, {
    method: "POST",
    headers: {
      "X-EMESSAGE-Auth": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ number, message }),
    cache: "no-store",
    signal: withTimeout(),
  });

  const payload = await readProviderJson<EMessageResponse>(response, "eMessage");
  if (!response.ok) {
    throw new Error(providerMessage(payload, `eMessage could not send the SMS (${response.status}).`));
  }
  return payload.data?.message || payload.message || "SMS was submitted successfully.";
}
