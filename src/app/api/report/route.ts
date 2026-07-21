import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      category?: string;
      description?: string;
      transactionId?: string;
    };

    if (!body.category || !body.description?.trim()) {
      return NextResponse.json(
        { error: "Choose an issue category and provide a short description." },
        { status: 400 },
      );
    }

    const ticketId = `ER-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      ticketId,
      category: body.category,
      transactionId: body.transactionId,
      submittedAt: new Date().toISOString(),
      status: "Forwarded to the responsible LGU",
    });
  } catch {
    return NextResponse.json({ error: "Unable to submit this report." }, { status: 400 });
  }
}
