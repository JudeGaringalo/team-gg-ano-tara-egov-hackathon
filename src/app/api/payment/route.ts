import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      amount?: number;
      provider?: string;
      transactionId?: string;
    };

    const amount = Number(body.amount ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
    }

    const provider = body.provider || "GCash";
    const paymentReference = `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;
    const claimCode = Math.floor(100000 + Math.random() * 900000).toString();
    const claimUrl = `https://demo.trash2cash.gov.ph/claim?ref=${encodeURIComponent(
      paymentReference,
    )}&amount=${amount.toFixed(2)}&provider=${encodeURIComponent(provider)}`;

    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      provider,
      transactionId: body.transactionId,
      paymentReference,
      claimCode,
      claimUrl,
      amount,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "Ready to claim",
      demo: true,
    });
  } catch {
    return NextResponse.json({ error: "Unable to create the payment request." }, { status: 400 });
  }
}
