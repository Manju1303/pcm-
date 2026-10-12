import { NextRequest, NextResponse } from "next/server";
import { generateHistoricalDataset } from "@/lib/simulator";
import { generateTelemetryCsv } from "@/lib/export";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get("hours") || "24", 10);

    const dataset = generateHistoricalDataset(hours, 10);
    const csvContent = generateTelemetryCsv(dataset);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="solar-dryer-readings-${hours}h.csv"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed generating CSV";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
