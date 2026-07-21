import { NextResponse } from "next/server";
import { createLivenessSession } from "@/lib/liveness";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { callbackUrl?: string };
    const callbackUrl = body.callbackUrl?.trim();
    if (!callbackUrl) return NextResponse.json({ error: "A callback URL is required." }, { status: 400 });
    return NextResponse.json(await createLivenessSession(callbackUrl));
  } catch (error) {
    console.error("Face Liveness session failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start Face Liveness." }, { status: 502 });
  }
}
