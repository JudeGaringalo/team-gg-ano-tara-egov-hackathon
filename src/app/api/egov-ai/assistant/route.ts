import { NextResponse } from "next/server";
import { askEGovAi } from "@/lib/egov-ai";

type RequestBody = {
  material?: string;
  question?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const material = body.material?.trim() || "recyclable materials";
    const question = body.question?.trim();

    const prompt = question || `
You are the citizen guidance assistant for eKalakal, a Philippine recycling incentive service.

The image-recognition step identified the submitted material as: ${material}.

Give the citizen concise practical guidance covering:
1. How to clean and prepare the material before drop-off.
2. Common reasons an accredited collection center may reject it.
3. A reminder that the final material type, weight, and reward are confirmed through physical inspection and weighing.

Use plain English. Keep the answer under 130 words. Do not invent government policies, collection-center locations, or guaranteed prices.
`.trim();

    const result = await askEGovAi(prompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error("eGov AI assistant route failed:", error);

    const message = error instanceof Error ? error.message : "Unable to contact eGov AI.";
    const isTimeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");

    return NextResponse.json(
      { error: isTimeout ? "eGov AI took too long to respond." : message },
      { status: 502 },
    );
  }
}
