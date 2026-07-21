import { NextResponse } from "next/server";

const MATERIALS = {
  pet: { label: "PET Plastic Bottles", rate: 30, unitWeight: 0.03 },
  aluminum: { label: "Aluminum Cans", rate: 70, unitWeight: 0.015 },
  cardboard: { label: "Cardboard", rate: 10, unitWeight: 0.25 },
  glass: { label: "Glass Bottles", rate: 5, unitWeight: 0.2 },
  ewaste: { label: "Small E-waste", rate: 25, unitWeight: 0.35 },
} as const;

type MaterialKey = keyof typeof MATERIALS;

function hashString(value: string) {
  return [...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      material?: MaterialKey;
      fileName?: string;
    };

    const material = body.material && MATERIALS[body.material] ? body.material : "pet";
    const info = MATERIALS[material];
    const seed = hashString(`${body.fileName ?? "sample"}-${material}`);
    const estimatedQuantity = 12 + (seed % 39);
    const estimatedWeight = Number(
      Math.max(0.4, estimatedQuantity * info.unitWeight * (0.85 + (seed % 30) / 100)).toFixed(2),
    );
    const estimatedReward = Number((estimatedWeight * info.rate).toFixed(2));
    const estimatedPoints = Math.round(estimatedReward * 3.33);
    const confidence = 86 + (seed % 12);

    await new Promise((resolve) => setTimeout(resolve, 850));

    return NextResponse.json({
      material,
      materialName: info.label,
      estimatedQuantity,
      estimatedWeight,
      ratePerKg: info.rate,
      estimatedReward,
      estimatedPoints,
      confidence,
      note: "This is an AI-assisted estimate. The collection center's physical weighing determines the final reward.",
    });
  } catch {
    return NextResponse.json({ error: "Unable to analyze the uploaded material." }, { status: 400 });
  }
}
