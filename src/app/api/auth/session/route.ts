import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const isAdmin = verifyAdminSession(req);
  return NextResponse.json({
    isAdmin,
  });
}
