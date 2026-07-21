import { NextResponse } from "next/server";

const RATES: Record<string, number> = {
  pet: 30,
  aluminum: 70,
  cardboard: 10,
  glass: 5,
  ewaste: 25,
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      material?: string;
      actualWeight?: number;
      centerId?: string;
    };

    const material = body.material ?? "pet";
    const rate = RATES[material] ?? RATES.pet;
    const actualWeight = Number(body.actualWeight ?? 0);

    if (!Number.isFinite(actualWeight) || actualWeight <= 0 || actualWeight > 100) {
      return NextResponse.json(
        { error: "Enter an actual weight between 0.01 kg and 100 kg." },
        { status: 400 },
      );
    }

    const finalReward = Number((actualWeight * rate).toFixed(2));
    const greenPoints = Math.round(finalReward * 3.33);
    const transactionId = `T2C-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    await new Promise((resolve) => setTimeout(resolve, 650));

    return NextResponse.json({
      transactionId,
      centerId: body.centerId,
      actualWeight,
      ratePerKg: rate,
      finalReward,
      greenPoints,
      validatedAt: new Date().toISOString(),
      status: "Validated",
    });
  } catch {
    return NextResponse.json({ error: "Unable to validate this transaction." }, { status: 400 });
  }
}
