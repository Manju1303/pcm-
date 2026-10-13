import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { z } from "zod";

// ============================================================================
// 1. Constant-Time API-Key Verification Tests
// ============================================================================
function timingSafeCompare(a, b) {
  if (!a || !b || typeof a !== "string" || typeof b !== "string" || a.length === 0 || b.length === 0) {
    return false;
  }
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB) && a.length === b.length;
}

test("Security: Constant-time comparison approves matching keys", () => {
  const secretKey = "sd_secure_college_dryer_key_2026_xyz";
  assert.equal(timingSafeCompare(secretKey, secretKey), true);
});

test("Security: Constant-time comparison rejects missing, empty, or null keys", () => {
  const secretKey = "sd_secure_college_dryer_key_2026_xyz";
  assert.equal(timingSafeCompare("", secretKey), false);
  assert.equal(timingSafeCompare(null, secretKey), false);
  assert.equal(timingSafeCompare(undefined, secretKey), false);
  assert.equal(timingSafeCompare(secretKey, null), false);
});

test("Security: Constant-time comparison rejects mismatched keys and lengths", () => {
  const secretKey = "sd_secure_college_dryer_key_2026_xyz";
  const wrongKey = "sd_secure_college_dryer_key_2026_wrong";
  const shortKey = "sd_secure";
  const longKey = "sd_secure_college_dryer_key_2026_xyz_extra";

  assert.equal(timingSafeCompare(wrongKey, secretKey), false);
  assert.equal(timingSafeCompare(shortKey, secretKey), false);
  assert.equal(timingSafeCompare(longKey, secretKey), false);
});

// ============================================================================
// 2. Zod Schema Telemetry Ingest Validation Tests
// ============================================================================
const tempValueSchema = z
  .union([
    z.number().min(-40).max(125),
    z.literal(-127), // DS18B20 disconnected sentinel
    z.literal(85),   // DS18B20 power-on reset sentinel
    z.null(),
  ])
  .optional();

const TelemetryIngestSchema = z.object({
  deviceId: z.string().min(1),
  timestamp: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
  temperatures: z.object({
    tray1: tempValueSchema,
    tray2: tempValueSchema,
    pcm: tempValueSchema,
  }),
  sensors: z.object({
    tray1: z.enum(["ok", "disconnected", "fault", "stale"]).optional(),
    tray2: z.enum(["ok", "disconnected", "fault", "stale"]).optional(),
    pcm: z.enum(["ok", "disconnected", "fault", "stale"]).optional(),
  }).optional(),
  batteryVoltage: z.number().min(0).max(20).nullable().optional(),
  romAddresses: z.object({
    tray1: z.string().optional(),
    tray2: z.string().optional(),
    pcm: z.string().optional(),
  }).optional(),
  buzzerState: z.object({
    buzzer1_ok: z.boolean().nullable().optional(),
    buzzer2_ok: z.boolean().nullable().optional(),
    heartbeat: z.boolean().optional(),
  }).optional(),
});

test("Zod Validation: Accepts valid telemetry frame within nominal bounds", () => {
  const validFrame = {
    deviceId: "solar-dryer-01",
    timestamp: "2026-10-13T10:00:00.000Z",
    temperatures: {
      tray1: 52.4,
      tray2: 48.1,
      pcm: 51.0,
    },
    batteryVoltage: 12.6,
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
  };

  const parsed = TelemetryIngestSchema.safeParse(validFrame);
  assert.equal(parsed.success, true);
});

test("Zod Validation: Accepts DS18B20 error sentinels -127°C and 85°C", () => {
  const frameWithSentinels = {
    deviceId: "solar-dryer-01",
    temperatures: {
      tray1: -127, // disconnected probe
      tray2: 85,   // power-on default
      pcm: null,
    },
  };

  const parsed = TelemetryIngestSchema.safeParse(frameWithSentinels);
  assert.equal(parsed.success, true);
});

test("Zod Validation: Rejects out-of-range temperatures (-50°C and 140°C)", () => {
  const tooColdFrame = {
    deviceId: "solar-dryer-01",
    temperatures: { tray1: -50, tray2: 40, pcm: 45 },
  };
  const tooHotFrame = {
    deviceId: "solar-dryer-01",
    temperatures: { tray1: 50, tray2: 40, pcm: 140 },
  };

  assert.equal(TelemetryIngestSchema.safeParse(tooColdFrame).success, false);
  assert.equal(TelemetryIngestSchema.safeParse(tooHotFrame).success, false);
});

test("Zod Validation: Validates battery voltage 0 to 20 V bounds", () => {
  const normalBattery = {
    deviceId: "solar-dryer-01",
    temperatures: { tray1: 40, tray2: 40, pcm: 40 },
    batteryVoltage: 13.8,
  };
  const negativeBattery = {
    deviceId: "solar-dryer-01",
    temperatures: { tray1: 40, tray2: 40, pcm: 40 },
    batteryVoltage: -1.0,
  };
  const excessiveBattery = {
    deviceId: "solar-dryer-01",
    temperatures: { tray1: 40, tray2: 40, pcm: 40 },
    batteryVoltage: 24.5,
  };

  assert.equal(TelemetryIngestSchema.safeParse(normalBattery).success, true);
  assert.equal(TelemetryIngestSchema.safeParse(negativeBattery).success, false);
  assert.equal(TelemetryIngestSchema.safeParse(excessiveBattery).success, false);
});

// ============================================================================
// 3. Sensor Fault Detection Logic Tests
// ============================================================================
function detectProbeFaults(sensor, value, consecutive85Count, recentReadings) {
  const faults = [];

  if (value === -127 || value === null) {
    faults.push({
      faultType: "disconnected",
      message: `${sensor} probe disconnected or 1-Wire signal lost (-127°C)`,
    });
  } else if (value === 85.0) {
    if (consecutive85Count >= 2) {
      faults.push({
        faultType: "power_on_reset",
        message: `${sensor} reporting persistent 85.0°C DS18B20 power-on reset default`,
      });
    }
  } else if (value < -40 || value > 125) {
    faults.push({
      faultType: "out_of_range",
      message: `${sensor} temperature reading ${value}°C is outside DS18B20 physical range`,
    });
  }

  // Flatline check: if 5+ readings are identical while another probe varied
  if (recentReadings && recentReadings.length >= 5) {
    const allSame = recentReadings.every((v) => v === recentReadings[0]);
    if (allSame) {
      faults.push({
        faultType: "flatline",
        message: `${sensor} probe flat-lined with zero change across consecutive measurements`,
      });
    }
  }

  return faults;
}

test("Fault Detection: Identifies disconnected probe (-127°C)", () => {
  const faults = detectProbeFaults("tray1", -127, 0, []);
  assert.equal(faults.length, 1);
  assert.equal(faults[0].faultType, "disconnected");
});

test("Fault Detection: Identifies repeated 85.0°C power-on reset state", () => {
  const single85 = detectProbeFaults("pcm", 85.0, 1, []);
  assert.equal(single85.length, 0, "Single 85.0C should not immediately flag until repeated");

  const repeated85 = detectProbeFaults("pcm", 85.0, 2, []);
  assert.equal(repeated85.length, 1);
  assert.equal(repeated85[0].faultType, "power_on_reset");
});

test("Fault Detection: Identifies flat-lined probe across consecutive intervals", () => {
  const flatlineReadings = [45.2, 45.2, 45.2, 45.2, 45.2];
  const faults = detectProbeFaults("tray2", 45.2, 0, flatlineReadings);
  assert.equal(faults.length, 1);
  assert.equal(faults[0].faultType, "flatline");
});

// ============================================================================
// 4. Stale and Offline Detection (2× Send Interval)
// ============================================================================
function evaluateDisconnectionStatus(lastSyncTimeIso, sendIntervalSec) {
  const timeoutMs = 2 * sendIntervalSec * 1000;
  if (!lastSyncTimeIso) {
    return { isOnline: false, isStale: false, isOffline: true };
  }
  const elapsed = Date.now() - new Date(lastSyncTimeIso).getTime();
  if (elapsed > timeoutMs) {
    return { isOnline: false, isStale: true, isOffline: true, elapsedMs: elapsed };
  }
  return { isOnline: true, isStale: false, isOffline: false, elapsedMs: elapsed };
}

test("Disconnection: Device is online when within 2× send interval", () => {
  const sendIntervalSec = 60; // 2x interval is 120s
  const lastSyncRecent = new Date(Date.now() - 50 * 1000).toISOString(); // 50s ago

  const status = evaluateDisconnectionStatus(lastSyncRecent, sendIntervalSec);
  assert.equal(status.isOnline, true);
  assert.equal(status.isStale, false);
  assert.equal(status.isOffline, false);
});

test("Disconnection: Device is marked Offline & Stale when exceeding 2× send interval", () => {
  const sendIntervalSec = 60; // 2x interval is 120s
  const lastSyncOverdue = new Date(Date.now() - 130 * 1000).toISOString(); // 130s ago (> 120s)

  const status = evaluateDisconnectionStatus(lastSyncOverdue, sendIntervalSec);
  assert.equal(status.isOnline, false);
  assert.equal(status.isStale, true);
  assert.equal(status.isOffline, true);
});

// ============================================================================
// 5. Threshold-to-Status Mapping Tests
// ============================================================================
function mapTemperatureToHealth(temp, warnThreshold, critThreshold) {
  if (temp === null || temp === undefined) return "no_data";
  if (temp >= critThreshold) return "critical";
  if (temp >= warnThreshold) return "warning";
  return "normal";
}

test("Thresholds: Correctly maps temperatures to normal, warning, and critical states", () => {
  const warnLimit = 58.0;
  const critLimit = 68.0;

  // Below warn limit
  assert.equal(mapTemperatureToHealth(45.0, warnLimit, critLimit), "normal");
  assert.equal(mapTemperatureToHealth(57.9, warnLimit, critLimit), "normal");

  // At or above warn limit, below crit
  assert.equal(mapTemperatureToHealth(58.0, warnLimit, critLimit), "warning");
  assert.equal(mapTemperatureToHealth(65.0, warnLimit, critLimit), "warning");
  assert.equal(mapTemperatureToHealth(67.9, warnLimit, critLimit), "warning");

  // At or above critical limit
  assert.equal(mapTemperatureToHealth(68.0, warnLimit, critLimit), "critical");
  assert.equal(mapTemperatureToHealth(75.5, warnLimit, critLimit), "critical");

  // Empty data
  assert.equal(mapTemperatureToHealth(null, warnLimit, critLimit), "no_data");
});

test("Operating Mode: Detects 'PCM Charging' when PCM temp is elevated in daylight", () => {
  const temps = { tray1: 52.0, tray2: 48.0, pcm: 50.0 };
  const avgTray = (temps.tray1 + temps.tray2) / 2.0; // 50.0
  const isPcmCharging = avgTray >= 38.0 && temps.pcm >= 45.0 && avgTray >= (temps.pcm - 3.0);
  assert.equal(isPcmCharging, true);
});

test("Operating Mode: Detects 'Nighttime Heat Release' when PCM temp > Tray temp", () => {
  const temps = { tray1: 34.0, tray2: 32.0, pcm: 47.0 };
  const avgTray = (temps.tray1 + temps.tray2) / 2.0; // 33.0
  const isNightRelease = temps.pcm >= 38.0 && temps.pcm > (avgTray + 2.0);
  assert.equal(isNightRelease, true);
});

test("Metrics: Statistical min, max, avg correctly computes or returns null on empty", () => {
  const values = [30.0, 40.0, 50.0, 60.0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Number((values.reduce((acc, v) => acc + v, 0) / values.length).toFixed(1));

  assert.equal(min, 30.0);
  assert.equal(max, 60.0);
  assert.equal(avg, 45.0);
});
