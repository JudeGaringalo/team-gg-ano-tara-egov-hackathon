import { NextResponse } from "next/server";
import { checkNationalIdQr } from "@/lib/everify";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { value?: string };
    if (!body.value?.trim()) return NextResponse.json({ error: "National ID QR value is required." }, { status: 400 });
    return NextResponse.json({ profile: await checkNationalIdQr(body.value.trim()) });
  } catch (error) {
    console.error("National ID QR check failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read the National ID QR." }, { status: 502 });
  }
}
