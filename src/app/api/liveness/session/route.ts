import { NextResponse } from "next/server";
import { createCloseLivenessSession, createLivenessSession } from "@/lib/liveness";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { callbackUrl?: string; flow?: string };
    const flow = body.flow === "close" ? "close" : "redirect";
    if (flow === "close") {
      return NextResponse.json(await createCloseLivenessSession());
    }
    const callbackUrl = body.callbackUrl?.trim();
    if (!callbackUrl) return NextResponse.json({ error: "A callback URL is required for redirect flow." }, { status: 400 });
    return NextResponse.json(await createLivenessSession(callbackUrl));
  } catch (error) {
    console.error("Face Liveness session failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start Face Liveness." }, { status: 502 });
  }
}
