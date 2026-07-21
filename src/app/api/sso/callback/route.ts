import { NextResponse } from "next/server";
import { authenticateWithEGovSSO } from "@/lib/egov-sso";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { exchangeCode?: string };
    const profile = await authenticateWithEGovSSO(body.exchangeCode?.trim() || "");
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("eGov SSO callback failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sign in with eGovPH." },
      { status: 502 },
    );
  }
}
