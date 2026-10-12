import { NextRequest, NextResponse } from "next/server";
import { TelemetryIngestSchema, TelemetryReading } from "@/types/telemetry";
import { generateHistoricalDataset, generateRealisticPoint } from "@/lib/simulator";

// In-memory server-side buffer for telemetry (synced with database when Supabase is connected)
const globalServerTelemetryStore: TelemetryReading[] = [];

// Rate-limiting map: ip -> lastTimestampMs
const rateLimitMap: Map<string, number> = new Map();
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second minimum interval per device

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const apiKey = req.headers.get("x-api-key") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedKey = process.env.API_INGEST_KEY || "sd_secret_key_college_dryer_2026";

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid or missing x-api-key header." },
        { status: 401 }
      );
    }

    // 2. Rate Limiting Check
    const clientIp = req.headers.get("x-forwarded-for") || "unknown-client";
    const lastRequest = rateLimitMap.get(clientIp);
    const now = Date.now();
    if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json(
        { error: "Too Many Requests. Rate limit exceeded (max 1 req/sec)." },
        { status: 429 }
      );
    }
    rateLimitMap.set(clientIp, now);

    // 3. Parse and Validate Payload
    const body = await req.json();
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

    const normalizedReading: TelemetryReading = {
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
      batteryVoltage: data.batteryVoltage ?? null,
      operatingStatus: data.operatingStatus ?? "Unknown/Not Configured",
      isDemo: false,
    };

    // Buffer to server storage (limit to 1000 items in memory)
    globalServerTelemetryStore.push(normalizedReading);
    if (globalServerTelemetryStore.length > 1000) {
      globalServerTelemetryStore.shift();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Telemetry ingested successfully",
        id: normalizedReading.id,
        timestamp: normalizedReading.timestamp,
        receivedTemperatures: normalizedReading.temperatures,
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
    const isDemo = searchParams.get("demo") !== "false";
    const limit = parseInt(searchParams.get("limit") || "200", 10);

    if (isDemo || globalServerTelemetryStore.length === 0) {
      // Return simulated dataset
      const data = generateHistoricalDataset(hours, Math.max(2, Math.round(hours / 2)));
      return NextResponse.json({
        source: "DEMO_SIMULATION",
        count: data.length,
        data: data.slice(-limit),
      });
    }

    // Return buffered real telemetry
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
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
