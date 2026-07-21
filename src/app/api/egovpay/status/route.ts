import { NextResponse } from "next/server";
import { getEGovPayTransaction } from "@/lib/egovpay";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { uuid?: string };
    if (!body.uuid?.trim()) return NextResponse.json({ error: "Transaction UUID is required." }, { status: 400 });
    return NextResponse.json({ transaction: await getEGovPayTransaction(body.uuid.trim()) });
  } catch (error) {
    console.error("eGovPay status failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to retrieve eGovPay status." }, { status: 502 });
  }
}
