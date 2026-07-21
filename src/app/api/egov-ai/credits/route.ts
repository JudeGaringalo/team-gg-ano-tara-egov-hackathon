import { NextResponse } from "next/server";
import { getEGovAiCredits } from "@/lib/egov-ai";

export async function GET() {
  try {
    return NextResponse.json(await getEGovAiCredits());
  } catch (error) {
    console.error("eGov AI credits route failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to retrieve eGov AI credits." },
      { status: 502 },
    );
  }
}
