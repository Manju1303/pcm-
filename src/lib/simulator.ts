import { TelemetryReading, OperatingMode } from "@/types/telemetry";

/**
 * Agni Sakthi Solar Dryer - Realistic Live Physics & Demo Simulator
 * Provides realistic fluctuating temperature telemetry:
 * - Tray 1 (Upper Deck): 49.0°C - 53.5°C
 * - Tray 2 (Lower Deck): 45.0°C - 49.5°C
 * - PCM Thermal Core: 49.5°C - 52.0°C (Plateau near paraffin melting point ~50°C)
 * - Battery Voltage: 12.6V - 13.2V
 * Dynamically fluctuates over time so dials, charts, and metrics are active and lively.
 */
export function generateRealisticPoint(date: Date = new Date()): TelemetryReading {
  const t = date.getTime();
  const hours = date.getHours() + date.getMinutes() / 60;

  // Day factor for historical trends
  const isDay = hours >= 7 && hours <= 18;
  const solarNorm = isDay ? Math.sin(((hours - 7) / 11) * Math.PI) : 0;

  // Dynamic multi-frequency oscillations for visible, organic live temperature fluctuations
  const osc1 = Math.sin(t / 2500) * 0.45 + Math.cos(t / 5500) * 0.3;
  const osc2 = Math.cos(t / 3000) * 0.35 + Math.sin(t / 6800) * 0.25;
  const oscPcm = Math.sin(t / 4200) * 0.22 + Math.cos(t / 9500) * 0.18;

  // Target operational baseline:
  // Tray 1: Upper deck hot airflow (~50.5 - 54.5°C)
  const tray1Temp = Number((50.5 + (solarNorm * 3.2) + osc1).toFixed(1));
  // Tray 2: Lower deck exhaust flow (~46.5 - 50.2°C)
  const tray2Temp = Number((46.8 + (solarNorm * 2.5) + osc2).toFixed(1));
  // PCM Thermal Core: Latent heat storage plateau (~49.8 - 52.2°C)
  const pcmTemp = Number((50.2 + (solarNorm * 1.5) + oscPcm).toFixed(1));

  // Battery voltage: ~12.7V with subtle ADC noise
  const batteryVoltage = Number((12.65 + Math.sin(t / 14000) * 0.12).toFixed(2));

  // Determine operating status
  let mode: OperatingMode = "PCM Charging";
  if (pcmTemp >= 49.5 && tray1Temp >= 48.0) {
    mode = "PCM Charging";
  } else if (pcmTemp > ((tray1Temp + tray2Temp) / 2 + 1.5)) {
    mode = "Nighttime Heat Release";
  } else if (tray1Temp >= 40.0) {
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
