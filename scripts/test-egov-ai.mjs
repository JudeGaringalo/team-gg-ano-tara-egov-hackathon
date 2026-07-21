import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filePath) {
  const values = {};
  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    values[line.slice(0, index)] = line.slice(index + 1);
  }

  return values;
}

const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const env = loadEnvFile(envPath);
const baseUrl = (env.EGOV_AI_BASE_URL || "https://egov-ai-core-ws.oueg.info").replace(/\/$/, "");
const accessCode = env.EGOV_AI_ACCESS_CODE;

if (!accessCode) {
  console.error("Missing EGOV_AI_ACCESS_CODE in .env.local");
  process.exit(1);
}

console.log("Requesting a short-lived eGov AI token...");
const tokenResponse = await fetch(`${baseUrl}/api/v1/egov/integration/token`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ access_code: accessCode }),
});

const tokenPayload = await tokenResponse.json();
if (!tokenResponse.ok || !tokenPayload.access_token) {
  console.error("Token request failed:", tokenResponse.status, tokenPayload);
  process.exit(1);
}

console.log(`Token received. Expires in ${tokenPayload.expires_in_seconds ?? "unknown"} seconds.`);

const creditsResponse = await fetch(`${baseUrl}/api/v1/egov/integration/credits`, {
  headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
});
const creditsPayload = await creditsResponse.json();

if (!creditsResponse.ok) {
  console.error("Credit check failed:", creditsResponse.status, creditsPayload);
  process.exit(1);
}

console.log("eGov AI connection successful.");
console.log({
  creditsTotal: creditsPayload.credits_total,
  creditsUsed: creditsPayload.credits_used,
  creditsRemaining: creditsPayload.credits_remaining,
  expiresAt: creditsPayload.expires_at,
});
