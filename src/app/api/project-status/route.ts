import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ProjectPhase } from "@/types/telemetry";

let inMemoryPhases: ProjectPhase[] = [
  {
    id: 1,
    phaseNumber: 1,
    title: "Hardware identification & wiring",
    status: "In progress",
    note: "Pin map proposed; probe model confirmation pending physical arrival.",
  },
  {
    id: 2,
    phaseNumber: 2,
    title: "ESP32 firmware",
    status: "In progress",
    note: "Autonomous local buzzers and 1-Wire discovery implemented; bench flash pending.",
  },
  {
    id: 3,
    phaseNumber: 3,
    title: "Dashboard & PWA",
    status: "Done",
    note: "Installed PWA with offline shell, sensor diagnostics, and security controls.",
  },
  {
    id: 4,
    phaseNumber: 4,
    title: "Database & device integration",
    status: "In progress",
    note: "Supabase schema ready with RLS policies; awaiting physical ESP32 telemetry feed.",
  },
  {
    id: 5,
    phaseNumber: 5,
    title: "Solar & battery power system",
    status: "Not started",
    note: "Bike battery, solar charge controller, and DC-DC converter not purchased yet.",
  },
  {
    id: 6,
    phaseNumber: 6,
    title: "Drying & PCM experiments",
    status: "Not started",
    note: "5-hour nocturnal heat release target awaiting validation under live drying run.",
  },
];

export async function GET() {
  const supabase = getSupabaseServer();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("project_status")
        .select("*")
        .order("phase_number", { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: ProjectPhase[] = data.map((d) => ({
          id: d.id,
          phaseNumber: d.phase_number,
          title: d.title,
          status: d.status,
          note: d.note || "",
          updatedAt: d.updated_at,
        }));
        return NextResponse.json({ phases: mapped });
      }
    } catch (e) {
      console.warn("Could not query project_status in Supabase:", e);
    }
  }

  return NextResponse.json({ phases: inMemoryPhases });
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
    const { phaseNumber, status, note } = body;

    if (!phaseNumber || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    inMemoryPhases = inMemoryPhases.map((p) =>
      p.phaseNumber === phaseNumber
        ? { ...p, status, note: note ?? p.note, updatedAt: new Date().toISOString() }
        : p
    );

    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase
        .from("project_status")
        .update({
          status,
          note,
          updated_at: new Date().toISOString(),
        })
        .eq("phase_number", phaseNumber);
    }

    return NextResponse.json({
      success: true,
      phases: inMemoryPhases,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
