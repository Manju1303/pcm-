import { NextRequest, NextResponse } from "next/server";
import { TelemetryIngestSchema, TelemetryReading } from "@/types/telemetry";
import { verifyDeviceApiKey } from "@/lib/auth";
import { detectSensorFaults, processRawReadingFaults } from "@/lib/faults-engine";
import { determineOperatingMode, DEFAULT_PCM_CONFIG } from "@/lib/operating-mode";
import {
  persistReadingToSupabase,
  persistSensorFaultToSupabase,
  getSupabaseServer,
} from "@/lib/supabase-server";

// In-memory server-side ring buffer for real telemetry (last 1000 items)
const globalServerTelemetryStore: TelemetryReading[] = [];

// Rate-limiting map for ingestion: ip -> lastTimestampMs (max 1 req/sec)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 1000;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request with constant-time comparison against DEVICE_API_KEY
    if (!verifyDeviceApiKey(req)) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid or missing x-api-key header." },
        { status: 401 }
      );
    }

    // 2. Rate Limiting Check
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-client";
    const lastRequest = rateLimitMap.get(clientIp);
    const now = Date.now();
    if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json(
        { error: "Too Many Requests. Rate limit exceeded (max 1 req/sec)." },
        { status: 429 }
      );
    }
    rateLimitMap.set(clientIp, now);

    // 3. Parse and Validate Payload with Zod
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Bad Request. JSON payload is missing or malformed." },
        { status: 400 }
      );
    }

    const parseResult = TelemetryIngestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid payload schema",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const timestamp = data.timestamp || new Date().toISOString();

    // 4. Initial Reading Construction
    let rawReading: TelemetryReading = {
      id: `reading-${now}-${Math.random().toString(36).substring(2, 7)}`,
      deviceId: data.deviceId,
      timestamp,
      temperatures: {
        tray1: data.temperatures.tray1 ?? null,
        tray2: data.temperatures.tray2 ?? null,
        pcm: data.temperatures.pcm ?? null,
      },
      sensors: {
        tray1: data.sensors?.tray1 ?? (data.temperatures.tray1 !== null ? "ok" : "disconnected"),
        tray2: data.sensors?.tray2 ?? (data.temperatures.tray2 !== null ? "ok" : "disconnected"),
        pcm: data.sensors?.pcm ?? (data.temperatures.pcm !== null ? "ok" : "disconnected"),
      },
      romAddresses: data.romAddresses,
      buzzerState: {
        buzzer1_ok: data.buzzerState?.buzzer1_ok ?? null,
        buzzer2_ok: data.buzzerState?.buzzer2_ok ?? null,
        heartbeat: data.buzzerState?.heartbeat ?? true,
      },
      batteryVoltage: data.batteryVoltage ?? null,
      moisturePercent: data.moisturePercent ?? null,
      operatingStatus: data.operatingStatus ?? "Unknown/Not Configured",
      isDemo: false,
    };

    // 5. Fault Detection & Processing (-127, 85, out-of-range, flatline, missing ROM)
    const faults = detectSensorFaults(rawReading, globalServerTelemetryStore);
    const processedReading = processRawReadingFaults(rawReading, faults);

    // 6. Operating Mode Determination
    if (!processedReading.operatingStatus || processedReading.operatingStatus === "Unknown/Not Configured") {
      processedReading.operatingStatus = determineOperatingMode(
        processedReading.temperatures,
        processedReading.sensors,
        DEFAULT_PCM_CONFIG
      );
    }

    // 7. Push to in-memory buffer
    globalServerTelemetryStore.push(processedReading);
    if (globalServerTelemetryStore.length > 1000) {
      globalServerTelemetryStore.shift();
    }

    // 8. Async persist to Supabase if configured
    persistReadingToSupabase(processedReading).catch((err) =>
      console.warn("Background Supabase insert error:", err)
    );
    for (const fault of faults) {
      persistSensorFaultToSupabase(processedReading.deviceId, fault).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        message: "Telemetry ingested successfully",
        id: processedReading.id,
        timestamp: processedReading.timestamp,
        receivedTemperatures: processedReading.temperatures,
        faultsDetected: faults.length,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get("hours") || "24", 10);
    const limit = Math.min(1000, parseInt(searchParams.get("limit") || "200", 10));

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Check if Supabase is connected to query persisted records
    const supabase = getSupabaseServer();
    if (supabase) {
      const { data, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .gte("timestamp", cutoff)
        .order("timestamp", { ascending: true })
        .limit(limit);

      if (!error && data && data.length > 0) {
        const formatted: TelemetryReading[] = data.map((row) => ({
          id: `db-${row.id}`,
          deviceId: row.device_id,
          timestamp: row.timestamp,
          temperatures: {
            tray1: row.tray1_temp !== null ? parseFloat(row.tray1_temp) : null,
            tray2: row.tray2_temp !== null ? parseFloat(row.tray2_temp) : null,
            pcm: row.pcm_temp !== null ? parseFloat(row.pcm_temp) : null,
          },
          sensors: {
            tray1: row.tray1_status || "ok",
            tray2: row.tray2_status || "ok",
            pcm: row.pcm_status || "ok",
          },
          romAddresses: {
            tray1: row.tray1_rom,
            tray2: row.tray2_rom,
            pcm: row.pcm_rom,
          },
          buzzerState: {
            buzzer1_ok: row.buzzer1_ok,
            buzzer2_ok: row.buzzer2_ok,
          },
          batteryVoltage: row.battery_voltage !== null ? parseFloat(row.battery_voltage) : null,
          moisturePercent: row.moisture_percent !== null ? parseFloat(row.moisture_percent) : null,
          operatingStatus: row.operating_status || "Unknown/Not Configured",
          isDemo: false,
        }));

        return NextResponse.json({
          source: "SUPABASE_POSTGRES",
          count: formatted.length,
          data: formatted,
        });
      }
    }

    // Return buffered real telemetry (NEVER generate fake demo data)
    const filtered = globalServerTelemetryStore
      .filter((r) => r.timestamp >= cutoff)
      .slice(-limit);

    return NextResponse.json({
      source: "REAL_HARDWARE",
      count: filtered.length,
      data: filtered,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
