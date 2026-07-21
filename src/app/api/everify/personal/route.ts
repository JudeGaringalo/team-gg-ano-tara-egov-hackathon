import { NextResponse } from "next/server";
import { verifyPersonalInformation } from "@/lib/everify";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      suffix?: string;
      birthDate?: string;
      faceLivenessSessionId?: string;
    };
    if (!body.firstName || !body.lastName || !body.birthDate || !body.faceLivenessSessionId) {
      return NextResponse.json({ error: "Name, birth date, and Face Liveness session are required." }, { status: 400 });
    }
    return NextResponse.json({
      profile: await verifyPersonalInformation({
        first_name: body.firstName,
        middle_name: body.middleName,
        last_name: body.lastName,
        suffix: body.suffix,
        birth_date: body.birthDate,
        face_liveness_session_id: body.faceLivenessSessionId,
      }),
    });
  } catch (error) {
    console.error("Personal information verification failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to verify personal information." }, { status: 502 });
  }
}
