import { NextResponse } from "next/server";
import { sendEMessageSms } from "@/lib/emessage";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { number?: string; message?: string };
    if (!body.number?.trim() || !body.message?.trim()) {
      return NextResponse.json({ error: "Mobile number and message are required." }, { status: 400 });
    }
    const result = await sendEMessageSms(body.number.trim(), body.message.trim());
    return NextResponse.json({ message: result });
  } catch (error) {
    console.error("eMessage send failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send the notification." }, { status: 502 });
  }
}
