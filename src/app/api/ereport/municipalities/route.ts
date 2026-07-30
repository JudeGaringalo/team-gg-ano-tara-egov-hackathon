import { NextResponse } from "next/server";
import { getMunicipalities } from "@/lib/ereport";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceCode = searchParams.get("province_code");
    if (!provinceCode) {
      return NextResponse.json({ error: "province_code is required." }, { status: 400 });
    }
    const data = await getMunicipalities(provinceCode);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch municipalities." }, { status: 502 });
  }
}
