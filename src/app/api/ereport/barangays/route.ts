import { NextResponse } from "next/server";
import { getBarangays } from "@/lib/ereport";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const municipalityCode = searchParams.get("municipality_code");
    if (!municipalityCode) {
      return NextResponse.json({ error: "municipality_code is required." }, { status: 400 });
    }
    const data = await getBarangays(municipalityCode);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch barangays." }, { status: 502 });
  }
}
