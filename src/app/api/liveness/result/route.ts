import { NextResponse } from "next/server";
import { getLivenessResult } from "@/lib/liveness";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    if (!body.token?.trim()) return NextResponse.json({ error: "Liveness session token is required." }, { status: 400 });
    return NextResponse.json(await getLivenessResult(body.token.trim()));
  } catch (error) {
    console.error("Face Liveness result failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to retrieve Face Liveness result." }, { status: 502 });
  }
}
