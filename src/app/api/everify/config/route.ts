import { NextResponse } from "next/server";

export async function GET() {
  const publicKey = process.env.EVERIFY_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "National ID e-Verify public key is missing." }, { status: 500 });
  }

  return NextResponse.json({
    publicKey,
    sdkUrl:
      process.env.EVERIFY_LIVENESS_SDK_URL ||
      "https://hackathon-everify-face-liveness.e.gov.ph/js/everify-liveness-sdk.min.js",
  });
}
