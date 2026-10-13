import { z } from "zod";

export type SensorStatus = "ok" | "disconnected" | "faulty" | "fault" | "stale" | "out_of_range";

export type SensorFaultType =
  | "disconnected"
  | "power_on_reset"
  | "out_of_range"
  | "flat_lined"
  | "missing_rom";

export interface SensorFaultEvent {
  id: string;
  sensor: "tray1" | "tray2" | "pcm";
  sensorName: string;
  faultType: SensorFaultType;
  message: string;
  timestamp: string;
  rawValue?: number | null;
  romAddress?: string;
}

export type OperatingMode =
  | "Daytime Drying"
  | "PCM Charging"
  | "Nighttime Heat Release"
  | "Idle"
  | "Unknown/Not Configured";

export interface TemperatureSet {
  tray1: number | null;
  tray2: number | null;
  pcm: number | null;
}

export interface SensorStatusSet {
  tray1: SensorStatus;
  tray2: SensorStatus;
  pcm: SensorStatus;
}

export interface BuzzerState {
  buzzer1_ok: boolean | null;
  buzzer2_ok: boolean | null;
  heartbeat?: boolean;
}

export interface TelemetryReading {
  id: string;
  deviceId: string;
  timestamp: string; // ISO 8601 UTC
  temperatures: TemperatureSet;
  sensors: SensorStatusSet;
  romAddresses?: {
    tray1?: string | null;
    tray2?: string | null;
    pcm?: string | null;
  };
  buzzerState?: BuzzerState;
  batteryVoltage?: number | null;
  moisturePercent?: number | null;
  operatingStatus: OperatingMode;
  isDemo?: boolean;
  faults?: SensorFaultEvent[];
}

// ROM address regex (e.g. 28:FF:64:1E:83:15:03:A4 or 28ff641e831503a4)
const romRegex = /^([0-9A-Fa-f]{2}[:-]?){7}[0-9A-Fa-f]{2}$/;

// Zod validation schema for POST /api/telemetry
export const TelemetryIngestSchema = z.object({
  deviceId: z
    .string({ required_error: "deviceId is required" })
    .min(1, "deviceId cannot be empty")
    .max(64, "deviceId cannot exceed 64 chars"),
  timestamp: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Timestamp must be a valid ISO-8601 UTC string",
    })
    .optional(),
  temperatures: z.object({
    tray1: z
      .number()
      .nullable()
      .optional()
      .refine(
        (val) =>
          val === null ||
          val === undefined ||
          val === -127 ||
          val === 85 ||
          (val >= -40 && val <= 125),
        { message: "Tray 1 temperature must be between -40°C and 125°C, or fault code (-127/85)" }
      ),
    tray2: z
      .number()
      .nullable()
      .optional()
      .refine(
        (val) =>
          val === null ||
          val === undefined ||
          val === -127 ||
          val === 85 ||
          (val >= -40 && val <= 125),
        { message: "Tray 2 temperature must be between -40°C and 125°C, or fault code (-127/85)" }
      ),
    pcm: z
      .number()
      .nullable()
      .optional()
      .refine(
        (val) =>
          val === null ||
          val === undefined ||
          val === -127 ||
          val === 85 ||
          (val >= -40 && val <= 125),
        { message: "PCM temperature must be between -40°C and 125°C, or fault code (-127/85)" }
      ),
  }),
  sensors: z
    .object({
      tray1: z.enum(["ok", "disconnected", "faulty", "stale", "out_of_range"]).default("ok"),
      tray2: z.enum(["ok", "disconnected", "faulty", "stale", "out_of_range"]).default("ok"),
      pcm: z.enum(["ok", "disconnected", "faulty", "stale", "out_of_range"]).default("ok"),
    })
    .optional(),
  romAddresses: z
    .object({
      tray1: z.string().regex(romRegex, "Invalid 64-bit ROM format").nullable().optional(),
      tray2: z.string().regex(romRegex, "Invalid 64-bit ROM format").nullable().optional(),
      pcm: z.string().regex(romRegex, "Invalid 64-bit ROM format").nullable().optional(),
    })
    .optional(),
  buzzerState: z
    .object({
      buzzer1_ok: z.boolean().nullable().optional(),
      buzzer2_ok: z.boolean().nullable().optional(),
      heartbeat: z.boolean().optional(),
    })
    .optional(),
  batteryVoltage: z
    .number()
    .min(0, "Battery voltage cannot be negative")
    .max(20, "Battery voltage cannot exceed 20V")
    .nullable()
    .optional(),
  moisturePercent: z
    .number()
    .min(0, "Moisture cannot be negative")
    .max(100, "Moisture cannot exceed 100%")
    .nullable()
    .optional(),
  operatingStatus: z
    .enum([
      "Daytime Drying",
      "PCM Charging",
      "Nighttime Heat Release",
      "Idle",
      "Unknown/Not Configured",
    ])
    .optional(),
  firmwareVersion: z.string().max(32).optional(),
  isDemo: z.boolean().optional(),
});

export type TelemetryIngestPayload = z.infer<typeof TelemetryIngestSchema>;

export interface AlertRule {
  id: string;
  sensor: "tray1" | "tray2" | "pcm" | "batteryVoltage";
  condition: "gt" | "lt";
  threshold: number;
  hysteresis: number;
  cooldownMs: number;
  severity: "warning" | "critical";
  message: string;
  enabled: boolean;
}

export interface AlertEvent {
  id: string;
  ruleId?: string;
  sensor: "tray1" | "tray2" | "pcm" | "batteryVoltage" | "device";
  source?: string;
  severity: "warning" | "critical" | "fault" | "offline";
  value?: number;
  threshold?: number;
  message: string;
  timestamp: string;
  status: "active" | "acknowledged" | "resolved";
  acknowledgedAt?: string | null;
}

export interface DeviceMetadata {
  id: string;
  name: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  firmwareVersion: string;
  batteryVoltage: number | null;
  isDemo: boolean;
  buzzerState: BuzzerState;
}

export interface FeatureFlags {
  gsmEnabled: boolean;
  moistureEnabled: boolean;
  batteryMonitorEnabled: boolean;
}

export interface SensorRomMapping {
  tray1Rom: string;
  tray2Rom: string;
  pcmRom: string;
}

export interface SystemThresholds {
  tray1Warn: number;
  tray1Crit: number;
  tray2Warn: number;
  tray2Crit: number;
  pcmWarn: number;
  pcmCrit: number;
  pcmChargeTrigger: number;
  pcmPlateau: number;
  dischargeDelta: number;
  sendIntervalSec: number;
  batteryDividerRatio: number;
  batteryCalibrationOffset: number;
}

export interface PcmCalibrationConfig {
  materialType: string;
  massKg: number;
  latentHeatKjKg: number;
  phaseChangeTempC: number;
  chargeStartTempC: number;
  dischargeThresholdDeltaC: number;
  meltingMinC: number;
  meltingMaxC: number;
  chamberHeatLossRateW: number; // Watts heat loss
  airflowRateM3h: number; // m3/h airflow
  isCalibrated: boolean;
  notes?: string;
}

export interface SystemSettings {
  thresholds: SystemThresholds;
  pcmConfig: PcmCalibrationConfig;
  featureFlags: FeatureFlags;
  sensorMapping: SensorRomMapping;
  detectedAddresses: string[];
}

export type ProjectPhaseStatus = "Not started" | "In progress" | "Done";

export interface ProjectPhase {
  id: number;
  phaseNumber: number;
  title: string;
  status: ProjectPhaseStatus;
  note?: string;
  updatedAt?: string;
}

export interface NightTestResult {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  durationHours: number;
  pcmAvgAboveTrayDeltaC: number;
  notes?: string;
  createdAt: string;
}

export interface TemperatureMetrics {
  min: number | null;
  max: number | null;
  avg: number | null;
  delta: number | null;
  count: number;
}

export interface PeriodSummaryMetrics {
  tray1: TemperatureMetrics;
  tray2: TemperatureMetrics;
  pcm: TemperatureMetrics;
  count: number;
}

// Standard probe names across the entire application
export const SENSOR_NAMES = {
  tray1: "Tray 1 - Upper Deck",
  tray2: "Tray 2 - Lower Deck",
  pcm: "PCM Thermal Core",
} as const;
