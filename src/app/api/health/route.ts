import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
    service: "Solar Dryer IoT Monitoring Backend",
    version: "1.0.0",
  });
}
