import { TelemetryReading } from "@/types/telemetry";

export function generateTelemetryCsv(readings: TelemetryReading[]): string {
  const headers = [
    "Timestamp (UTC)",
    "Timestamp (Local)",
    "Device ID",
    "Tray 1 Temp (°C)",
    "Tray 1 Status",
    "Tray 2 Temp (°C)",
    "Tray 2 Status",
    "PCM Temp (°C)",
    "PCM Status",
    "Battery Voltage (V)",
    "Operating Status",
    "Faults",
    "Data Source",
  ];

  const rows = readings.map((r) => {
    let localTime = "";
    try {
      localTime = new Date(r.timestamp).toLocaleString();
    } catch {
      localTime = r.timestamp;
    }

    const faultsList = r.faults && r.faults.length > 0
      ? r.faults.map((f) => `${f.sensor}:${f.faultType}`).join("; ")
      : "None";

    return [
      `"${r.timestamp}"`,
      `"${localTime}"`,
      `"${r.deviceId}"`,
      r.temperatures.tray1 !== null && r.temperatures.tray1 !== undefined ? r.temperatures.tray1.toFixed(1) : "--",
      r.sensors.tray1,
      r.temperatures.tray2 !== null && r.temperatures.tray2 !== undefined ? r.temperatures.tray2.toFixed(1) : "--",
      r.sensors.tray2,
      r.temperatures.pcm !== null && r.temperatures.pcm !== undefined ? r.temperatures.pcm.toFixed(1) : "--",
      r.sensors.pcm,
      r.batteryVoltage !== undefined && r.batteryVoltage !== null ? r.batteryVoltage.toFixed(2) : "--",
      `"${r.operatingStatus}"`,
      `"${faultsList}"`,
      r.isDemo ? "DEMO_SIMULATION" : "REAL_HARDWARE",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function downloadCsvFile(csvContent: string, filename: string = "solar-dryer-telemetry.csv") {
  if (typeof window === "undefined") return;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
