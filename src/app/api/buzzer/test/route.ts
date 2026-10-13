import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Administrator session required to test alert buzzers." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Buzzer test signal authorized by admin.",
    timestamp: new Date().toISOString(),
  });
}
