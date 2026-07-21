import { NextResponse } from "next/server";
import { verifyNationalIdQr } from "@/lib/everify";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { value?: string; faceLivenessSessionId?: string };
    if (!body.value?.trim() || !body.faceLivenessSessionId?.trim()) {
      return NextResponse.json({ error: "National ID QR and Face Liveness session are required." }, { status: 400 });
    }
    return NextResponse.json({
      profile: await verifyNationalIdQr(body.value.trim(), body.faceLivenessSessionId.trim()),
    });
  } catch (error) {
    console.error("National ID QR verification failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to verify the National ID." }, { status: 502 });
  }
}
