import { NextResponse } from "next/server";
import { createEGovPayCollection } from "@/lib/egovpay";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      amount?: number; txnid?: string; redirectUrl?: string; callbackUrl?: string;
      mobile?: string; email?: string; name?: string;
    };
    if (!body.amount || !body.txnid || !body.redirectUrl || !body.callbackUrl) {
      return NextResponse.json({ error: "Amount, transaction ID, redirect URL, and callback URL are required." }, { status: 400 });
    }
    return NextResponse.json({ transaction: await createEGovPayCollection({
      amount: body.amount,
      txnid: body.txnid,
      redirectUrl: body.redirectUrl,
      callbackUrl: body.callbackUrl,
      mobile: body.mobile,
      email: body.email,
      name: body.name,
    }) });
  } catch (error) {
    console.error("eGovPay collection failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create the eGovPay transaction." }, { status: 502 });
  }
}
