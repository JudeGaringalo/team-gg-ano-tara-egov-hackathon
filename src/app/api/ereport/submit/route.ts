import { NextResponse } from "next/server";
import { submitEReportComplaint, type EReportComplaintInput } from "@/lib/ereport";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<EReportComplaintInput>;
    const required: Array<keyof EReportComplaintInput> = [
      "mobile", "first_name", "last_name", "gender", "complainant_email", "report_type",
      "subject", "message", "region_code", "province_code", "municipality_code", "barangay_code",
    ];
    const missing = required.filter((key) => !String(body[key] ?? "").trim());
    if (missing.length) {
      return NextResponse.json({ error: `Missing report fields: ${missing.join(", ")}.` }, { status: 400 });
    }

    const result = await submitEReportComplaint({
      ...(body as EReportComplaintInput),
      evidences: Array.isArray(body.evidences) ? body.evidences : [],
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("eReport submission failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit the report." }, { status: 502 });
  }
}
