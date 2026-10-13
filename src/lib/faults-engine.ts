import {
  TelemetryReading,
  SensorFaultEvent,
  SensorFaultType,
  SENSOR_NAMES,
  SensorStatus,
} from "@/types/telemetry";

// In-memory rolling history for flat-line detection (sensor -> last values)
interface FlatLineTracker {
  values: number[];
  timestamps: number[];
}

const probeHistoryMap = new Map<string, FlatLineTracker>();
const MAX_FLATLINE_WINDOW = 12; // Check across past ~12 samples

export function detectSensorFaults(
  current: TelemetryReading,
  previousHistory: TelemetryReading[] = []
): SensorFaultEvent[] {
  const faults: SensorFaultEvent[] = [];
  const nowIso = current.timestamp || new Date().toISOString();

  const probes: Array<"tray1" | "tray2" | "pcm"> = ["tray1", "tray2", "pcm"];

  // Check each probe
  for (const probe of probes) {
    const temp = current.temperatures[probe];
    const rom = current.romAddresses?.[probe];
    const probeLabel = SENSOR_NAMES[probe];

    // 1. Disconnected (-127°C)
    if (temp === -127 || current.sensors[probe] === "disconnected") {
      faults.push({
        id: `fault-disconn-${probe}-${Date.now()}`,
        sensor: probe,
        sensorName: probeLabel,
        faultType: "disconnected",
        message: `${probeLabel} probe disconnected (-127°C / bus communication loss)`,
        timestamp: nowIso,
        rawValue: -127,
        romAddress: rom || undefined,
      });
      continue;
    }

    // 2. Power-on reset default (85.0°C)
    if (temp === 85.0) {
      faults.push({
        id: `fault-85-${probe}-${Date.now()}`,
        sensor: probe,
        sensorName: probeLabel,
        faultType: "power_on_reset",
        message: `${probeLabel} reported DS18B20 power-on reset state (85.0°C uncompleted conversion)`,
        timestamp: nowIso,
        rawValue: 85.0,
        romAddress: rom || undefined,
      });
      continue;
    }

    // 3. Out-of-range (< -40°C or > 125°C)
    if (temp !== null && temp !== undefined && (temp < -40 || temp > 125)) {
      faults.push({
        id: `fault-range-${probe}-${Date.now()}`,
        sensor: probe,
        sensorName: probeLabel,
        faultType: "out_of_range",
        message: `${probeLabel} out-of-range reading (${temp.toFixed(1)}°C outside -40 to 125°C limit)`,
        timestamp: nowIso,
        rawValue: temp,
        romAddress: rom || undefined,
      });
      continue;
    }

    // 4. Missing ROM address
    if (temp !== null && (!rom || rom.trim() === "")) {
      faults.push({
        id: `fault-rom-${probe}-${Date.now()}`,
        sensor: probe,
        sensorName: probeLabel,
        faultType: "missing_rom",
        message: `${probeLabel} reporting temperature without verified 64-bit ROM hardware address`,
        timestamp: nowIso,
        rawValue: temp,
      });
    }

    // 5. Flat-line detection (no change over multiple frames while other probes are changing)
    if (temp !== null && previousHistory.length >= 6) {
      const recentReadings = previousHistory.slice(-8);
      const probeValues = recentReadings
        .map((r) => r.temperatures[probe])
        .filter((v): v is number => v !== null);

      if (probeValues.length >= 6) {
        const isFlat = probeValues.every((v) => Math.abs(v - temp) < 0.01);

        // Check if other probes moved noticeably (> 1.5°C swing)
        const otherProbes = probes.filter((p) => p !== probe);
        const otherSwings = otherProbes.map((p) => {
          const vals = recentReadings
            .map((r) => r.temperatures[p])
            .filter((v): v is number => v !== null);
          if (vals.length < 2) return 0;
          return Math.max(...vals) - Math.min(...vals);
        });

        const otherMoved = otherSwings.some((swing) => swing > 1.5);

        if (isFlat && otherMoved) {
          faults.push({
            id: `fault-flatline-${probe}-${Date.now()}`,
            sensor: probe,
            sensorName: probeLabel,
            faultType: "flat_lined",
            message: `${probeLabel} flat-lined at exactly ${temp.toFixed(1)}°C while adjacent chamber sensors fluctuated`,
            timestamp: nowIso,
            rawValue: temp,
            romAddress: rom || undefined,
          });
        }
      }
    }
  }

  return faults;
}

/**
 * Normalizes temperatures and updates sensor status flags according to detected faults
 */
export function processRawReadingFaults(reading: TelemetryReading, faults: SensorFaultEvent[]): TelemetryReading {
  const updatedSensors = { ...reading.sensors };
  const updatedTemps = { ...reading.temperatures };

  for (const fault of faults) {
    if (fault.faultType === "disconnected") {
      updatedSensors[fault.sensor] = "disconnected";
      updatedTemps[fault.sensor] = null;
    } else if (fault.faultType === "power_on_reset") {
      updatedSensors[fault.sensor] = "faulty";
      updatedTemps[fault.sensor] = null;
    } else if (fault.faultType === "out_of_range") {
      updatedSensors[fault.sensor] = "out_of_range";
      updatedTemps[fault.sensor] = null;
    } else if (fault.faultType === "flat_lined") {
      updatedSensors[fault.sensor] = "faulty";
    }
  }

  return {
    ...reading,
    temperatures: updatedTemps,
    sensors: updatedSensors,
    faults,
  };
}
