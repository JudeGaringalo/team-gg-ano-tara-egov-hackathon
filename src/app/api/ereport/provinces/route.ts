import { NextResponse } from "next/server";
import { getProvinces } from "@/lib/ereport";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionCode = searchParams.get("region_code");
    if (!regionCode) {
      return NextResponse.json({ error: "region_code is required." }, { status: 400 });
    }
    const data = await getProvinces(regionCode);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch provinces." }, { status: 502 });
  }
}
