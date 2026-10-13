import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-server";
import { NightTestResult } from "@/types/telemetry";

let inMemoryNightTests: NightTestResult[] = [];

export async function GET() {
  const supabase = getSupabaseServer();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("night_tests")
        .select("*")
        .order("start_time", { ascending: false });

      if (!error && data) {
        const tests: NightTestResult[] = data.map((d) => ({
          id: d.id,
          startTime: d.start_time,
          endTime: d.end_time,
          durationMinutes: parseFloat(d.duration_minutes) || 0,
          durationHours: Number(((parseFloat(d.duration_minutes) || 0) / 60).toFixed(1)),
          pcmAvgAboveTrayDeltaC: parseFloat(d.pcm_avg_above_tray_delta_c) || 0,
          notes: d.notes || "",
          createdAt: d.created_at,
        }));
        return NextResponse.json({ tests });
      }
    } catch (e) {
      console.warn("Could not query night_tests in Supabase:", e);
    }
  }

  return NextResponse.json({ tests: inMemoryNightTests });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Administrator login required." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { startTime, endTime, durationMinutes, pcmAvgAboveTrayDeltaC, notes } = body;

    const newTest: NightTestResult = {
      id: `night-test-${Date.now()}`,
      startTime,
      endTime,
      durationMinutes,
      durationHours: Number((durationMinutes / 60).toFixed(1)),
      pcmAvgAboveTrayDeltaC: pcmAvgAboveTrayDeltaC || 0,
      notes: notes || "",
      createdAt: new Date().toISOString(),
    };

    inMemoryNightTests.unshift(newTest);

    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase.from("night_tests").insert({
        device_id: process.env.DEFAULT_DEVICE_ID || "agni-sakthi-01",
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        pcm_avg_above_tray_delta_c: pcmAvgAboveTrayDeltaC,
        notes: notes || "",
      });
    }

    return NextResponse.json({ success: true, test: newTest });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
