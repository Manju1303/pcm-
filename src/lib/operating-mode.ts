import { OperatingMode, SensorStatusSet, TemperatureSet, PcmCalibrationConfig } from "@/types/telemetry";

export const DEFAULT_PCM_CONFIG: PcmCalibrationConfig = {
  materialType: "Paraffin RT-50",
  massKg: 2.5,
  latentHeatKjKg: 190.0,
  phaseChangeTempC: 50.0,
  chargeStartTempC: 45.0,
  dischargeThresholdDeltaC: 2.0,
  meltingMinC: 45.0,
  meltingMaxC: 51.0,
  chamberHeatLossRateW: 0.0,
  airflowRateM3h: 0.0,
  isCalibrated: false,
  notes: "Provisional parameters — verify against chemical supplier datasheet.",
};

/**
 * Determines current operating mode based on sensor validity and thermal rules.
 * If sensors are missing or disconnected, returns "Unknown/Not Configured".
 */
export function determineOperatingMode(
  temps: TemperatureSet,
  sensors: SensorStatusSet,
  config: PcmCalibrationConfig = DEFAULT_PCM_CONFIG
): OperatingMode {
  if (
    sensors.tray1 !== "ok" ||
    sensors.tray2 !== "ok" ||
    sensors.pcm !== "ok" ||
    temps.tray1 === null ||
    temps.tray2 === null ||
    temps.pcm === null
  ) {
    return "Unknown/Not Configured";
  }

  const avgTray = (temps.tray1 + temps.tray2) / 2.0;
  const pcm = temps.pcm;

  // Rule 1: PCM Charging
  // Tray temps are hot (sun shining) and PCM has reached or exceeded charge start temperature
  if (avgTray >= 38.0 && pcm >= config.chargeStartTempC && avgTray >= (pcm - 3.0)) {
    return "PCM Charging";
  }

  // Rule 2: Daytime Drying
  // Collector heats trays significantly higher than ambient, and tray hotter than PCM
  if (avgTray >= 35.0 && avgTray > pcm) {
    return "Daytime Drying";
  }

  // Rule 3: Nighttime Heat Release
  // Solar irradiance has ceased (ambient/tray cooler), but PCM is hot and radiating into trays
  if (pcm >= 38.0 && pcm > (avgTray + config.dischargeThresholdDeltaC)) {
    return "Nighttime Heat Release";
  }

  // Rule 4: Idle
  return "Idle";
}
