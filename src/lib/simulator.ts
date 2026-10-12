import { TelemetryReading, OperatingMode } from "@/types/telemetry";

/**
 * Realistic Solar Dryer Physics Simulator
 * Simulates real thermodynamic behavior:
 * - Diurnal solar irradiance curve
 * - Solar air collector heating Trays (35°C to 58°C)
 * - PCM phase change plateau (~49°C - 51°C melting point)
 * - Latent heat discharge at night (holding Trays above ambient for ~5 hours)
 * - Realistic thermocouple measurement noise
 */
export function generateRealisticPoint(date: Date): TelemetryReading {
  const hours = date.getHours() + date.getMinutes() / 60;

  // Diurnal solar intensity factor (0 at night, peaks at 1.0 around 13:00)
  let solarFactor = 0;
  if (hours >= 6.5 && hours <= 18.0) {
    solarFactor = Math.sin(((hours - 6.5) / 11.5) * Math.PI);
  }

  // Base ambient temperature (24°C at night, 32°C at peak day)
  const ambientTemp = 24.0 + 8.0 * Math.sin(((hours - 4) / 24) * 2 * Math.PI);

  // Solar collector heating trays
  const solarHeatingEffect = solarFactor * 26.0;

  // PCM thermal state calculation
  // Daytime (7 to 17): PCM charges up to ~52°C and stays around phase plateau
  // Nighttime (18 to 23): PCM slowly discharges latent heat maintaining ~44°C - 48°C
  // Late night (0 to 6): PCM drops towards ambient
  let pcmTemp = ambientTemp;
  let tray1BonusFromPcm = 0;
  let tray2BonusFromPcm = 0;
  let mode: OperatingMode = "Idle";

  if (hours >= 7 && hours < 17) {
    // Charging phase
    // PCM absorbs sensible heat then plateaus around 50°C
    const pcmTarget = 28.0 + solarFactor * 24.0;
    // Dampen rise near phase change (48 - 52 °C)
    pcmTemp = pcmTarget > 48.0 ? 49.0 + (pcmTarget - 48.0) * 0.25 : pcmTarget;
    if (pcmTemp >= 46.0 && solarFactor > 0.4) {
      mode = "PCM Charging";
    } else if (solarFactor > 0.2) {
      mode = "Daytime Drying";
    } else {
      mode = "Idle";
    }
  } else if (hours >= 17 && hours <= 23) {
    // Discharging phase: Nighttime Heat Release
    // PCM releases latent heat stored in paraffin wax (holding ~46°C - 49°C)
    const dischargeHour = hours - 17; // 0 to 6 hours
    pcmTemp = Math.max(ambientTemp + 4.0, 50.0 - dischargeHour * 1.8);
    tray1BonusFromPcm = Math.max(0, (pcmTemp - ambientTemp) * 0.45);
    tray2BonusFromPcm = Math.max(0, (pcmTemp - ambientTemp) * 0.40);
    mode = "Nighttime Heat Release";
  } else {
    // Early morning cool down
    pcmTemp = ambientTemp + 1.5;
    mode = "Idle";
  }

  // Micro sensor noise (±0.15°C)
  const noise1 = (Math.sin(date.getTime() / 15000) * 0.15);
  const noise2 = (Math.cos(date.getTime() / 17000) * 0.18);
  const noisePcm = (Math.sin(date.getTime() / 25000) * 0.1);

  // Tray 1 is closer to collector outlet, Tray 2 has slight gradient
  const tray1Temp = Number((ambientTemp + solarHeatingEffect + tray1BonusFromPcm + noise1).toFixed(1));
  const tray2Temp = Number((ambientTemp + solarHeatingEffect * 0.92 + tray2BonusFromPcm + noise2).toFixed(1));
  const finalPcmTemp = Number((pcmTemp + noisePcm).toFixed(1));

  // Battery voltage simulation (12V nominal solar battery: 13.8V in full sun, 12.3V at night)
  const batteryVoltage = Number((12.2 + solarFactor * 1.8 + Math.sin(date.getTime() / 50000) * 0.05).toFixed(2));

  return {
    id: `demo-${date.getTime()}`,
    deviceId: "solar-dryer-01",
    timestamp: date.toISOString(),
    temperatures: {
      tray1: tray1Temp,
      tray2: tray2Temp,
      pcm: finalPcmTemp,
    },
    sensors: {
      tray1: "ok",
      tray2: "ok",
      pcm: "ok",
    },
    batteryVoltage,
    operatingStatus: mode,
    isDemo: true,
  };
}

/**
 * Generates an array of historical points over a given number of hours
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
