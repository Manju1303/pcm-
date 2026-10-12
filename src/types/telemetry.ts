import { z } from "zod";

export type SensorStatus = "ok" | "disconnected" | "faulty" | "stale";

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

export interface TelemetryReading {
  id: string;
  deviceId: string;
  timestamp: string; // ISO 8601 UTC
  temperatures: TemperatureSet;
  sensors: SensorStatusSet;
  batteryVoltage?: number | null;
  operatingStatus: OperatingMode;
  isDemo?: boolean;
}

// Zod validation schema for POST /api/telemetry
export const TelemetryIngestSchema = z.object({
  deviceId: z.string().min(1).max(64),
  timestamp: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Timestamp must be a valid ISO-8601 UTC string",
  }).optional(),
  temperatures: z.object({
    tray1: z.number().nullable().optional(),
    tray2: z.number().nullable().optional(),
    pcm: z.number().nullable().optional(),
  }),
  sensors: z.object({
    tray1: z.enum(["ok", "disconnected", "faulty", "stale"]).default("ok"),
    tray2: z.enum(["ok", "disconnected", "faulty", "stale"]).default("ok"),
    pcm: z.enum(["ok", "disconnected", "faulty", "stale"]).default("ok"),
  }).optional(),
  batteryVoltage: z.number().min(0).max(30).nullable().optional(),
  operatingStatus: z.enum([
    "Daytime Drying",
    "PCM Charging",
    "Nighttime Heat Release",
    "Idle",
    "Unknown/Not Configured",
  ]).optional(),
  firmwareVersion: z.string().optional(),
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
  ruleId: string;
  sensor: "tray1" | "tray2" | "pcm" | "batteryVoltage";
  severity: "warning" | "critical";
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
  status: "active" | "acknowledged" | "resolved";
}

export interface DeviceMetadata {
  id: string;
  name: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  firmwareVersion: string;
  batteryVoltage: number | null;
  isDemo: boolean;
}

export interface PcmCalibrationConfig {
  materialType: string;
  massKg: number;
  latentHeatKjKg: number;
  phaseChangeTempC: number;
  chargeStartTempC: number;
  dischargeThresholdDeltaC: number;
  chamberHeatLossRateW: number; // Watts heat loss
  isCalibrated: boolean;
  notes?: string;
}

export interface TemperatureMetrics {
  min: number;
  max: number;
  avg: number;
  delta: number;
  count: number;
}

export interface PeriodSummaryMetrics {
  tray1: TemperatureMetrics;
  tray2: TemperatureMetrics;
  pcm: TemperatureMetrics;
  count: number;
}
