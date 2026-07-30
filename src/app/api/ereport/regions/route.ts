import { NextResponse } from "next/server";
import { getRegions } from "@/lib/ereport";

export async function GET() {
  try {
    const data = await getRegions();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch regions." }, { status: 502 });
  }
}
