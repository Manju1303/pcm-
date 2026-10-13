import { TelemetryReading, OperatingMode } from "@/types/telemetry";

/**
 * Agni Sakthi Solar Dryer - Realistic Live Physics & Demo Simulator
 * Provides realistic fluctuating temperature telemetry:
 * - Tray 1 (Upper Deck): Varies up to 80.0°C (Collector hot airflow)
 * - Tray 2 (Lower Deck): Varies up to 80.0°C (Exhaust flow zone)
 * - PCM Thermal Core: Varies up to 53.0°C (Latent paraffin storage plateau ~50-52°C)
 * - Battery Voltage: 12.6V - 13.2V
 * Dynamically oscillates so dials, charts, and metrics are active and lively.
 */
export function generateRealisticPoint(date: Date = new Date()): TelemetryReading {
  const t = date.getTime();
  const hours = date.getHours() + date.getMinutes() / 60;

  // Day factor for historical trends
  const isDay = hours >= 7 && hours <= 18;
  const solarNorm = isDay ? Math.sin(((hours - 7) / 11) * Math.PI) : 0;

  // Dynamic multi-frequency oscillations for organic, responsive live temperature fluctuations
  const osc1 = Math.sin(t / 2400) * 0.8 + Math.cos(t / 5200) * 0.5;
  const osc2 = Math.cos(t / 2800) * 0.7 + Math.sin(t / 6400) * 0.45;
  const oscPcm = Math.sin(t / 3800) * 0.35 + Math.cos(t / 8600) * 0.25;

  // Temperature ranges per user specification:
  // Tray 1: Collector hot air stream varying up to 80.0°C
  const rawTray1 = 58.0 + (solarNorm * 20.8) + osc1;
  const tray1Temp = Number(Math.min(80.0, Math.max(36.0, rawTray1)).toFixed(1));

  // Tray 2: Intermediate deck flow zone varying up to 80.0°C
  const rawTray2 = 55.0 + (solarNorm * 23.6) + osc2;
  const tray2Temp = Number(Math.min(80.0, Math.max(34.0, rawTray2)).toFixed(1));

  // PCM Thermal Core: Latent storage bed varying up to 53.0°C (phase plateau ~50-52°C)
  const rawPcm = 48.6 + (solarNorm * 3.7) + oscPcm;
  const pcmTemp = Number(Math.min(53.0, Math.max(38.0, rawPcm)).toFixed(1));

  // Battery voltage: ~12.7V with subtle ADC noise
  const batteryVoltage = Number((12.65 + Math.sin(t / 14000) * 0.12).toFixed(2));

  // Determine operating status
  let mode: OperatingMode = "PCM Charging";
  if (pcmTemp >= 49.0 && tray1Temp >= 48.0) {
    mode = "PCM Charging";
  } else if (pcmTemp > ((tray1Temp + tray2Temp) / 2 + 1.5)) {
    mode = "Nighttime Heat Release";
  } else if (tray1Temp >= 42.0) {
    mode = "Daytime Drying";
  } else {
    mode = "Idle";
  }

  return {
    id: `live-demo-${t}`,
    deviceId: "agni-sakthi-01",
    timestamp: date.toISOString(),
    temperatures: {
      tray1: tray1Temp,
      tray2: tray2Temp,
      pcm: pcmTemp,
    },
    sensors: {
      tray1: "ok",
      tray2: "ok",
      pcm: "ok",
    },
    romAddresses: {
      tray1: "28FF641E831704AD",
      tray2: "28FF641E831704AE",
      pcm: "28FF641E831704AF",
    },
    buzzerState: {
      buzzer1_ok: true,
      buzzer2_ok: true,
      heartbeat: true,
    },
    batteryVoltage,
    operatingStatus: mode,
    isDemo: true,
  };
}

/**
 * Generates historical dataset over the specified hours with smooth realistic curves
 */
export function generateHistoricalDataset(hoursBack: number = 24, stepMinutes: number = 10): TelemetryReading[] {
  const points: TelemetryReading[] = [];
  const now = new Date();
  const totalSteps = Math.floor((hoursBack * 60) / stepMinutes);

  for (let i = totalSteps; i >= 0; i--) {
    const pointTime = new Date(now.getTime() - i * stepMinutes * 60 * 1000);
    points.push(generateRealisticPoint(pointTime));
  }

  return points;
}
