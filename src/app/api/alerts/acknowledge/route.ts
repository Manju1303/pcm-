import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Administrator login required to acknowledge alerts." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { alertId } = body;

    const supabase = getSupabaseServer();
    if (supabase && alertId) {
      await supabase
        .from("alert_events")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: "Admin",
        })
        .eq("id", alertId);
    }

    return NextResponse.json({
      success: true,
      message: "Alert acknowledged successfully",
      alertId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
