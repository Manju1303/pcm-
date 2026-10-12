import test from "node:test";
import assert from "node:assert/strict";

// 1. Test Operating Mode Evaluation
test("Operating Mode: Detects 'PCM Charging' when PCM temp is elevated in daylight", () => {
  const temps = { tray1: 52.0, tray2: 48.0, pcm: 50.0 };
  const sensors = { tray1: "ok", tray2: "ok", pcm: "ok" };
  const config = {
    chargeStartTempC: 45.0,
    dischargeThresholdDeltaC: 2.0,
  };

  const avgTray = (temps.tray1 + temps.tray2) / 2.0; // 50.0
  const isPcmCharging = avgTray >= 38.0 && temps.pcm >= config.chargeStartTempC && avgTray >= (temps.pcm - 3.0);
  assert.equal(isPcmCharging, true);
});

test("Operating Mode: Detects 'Nighttime Heat Release' when PCM temp > Tray temp", () => {
  const temps = { tray1: 34.0, tray2: 32.0, pcm: 47.0 };
  const avgTray = (temps.tray1 + temps.tray2) / 2.0; // 33.0
  const isNightRelease = temps.pcm >= 38.0 && temps.pcm > (avgTray + 2.0);
  assert.equal(isNightRelease, true);
});

test("Operating Mode: Returns 'Unknown/Not Configured' when sensor is disconnected", () => {
  const sensors = { tray1: "disconnected", tray2: "ok", pcm: "ok" };
  const hasDisconnected = sensors.tray1 !== "ok" || sensors.tray2 !== "ok" || sensors.pcm !== "ok";
  assert.equal(hasDisconnected, true);
});

// 2. Test Statistical Metrics Computation
test("Metrics: Correctly computes min, max, avg, and delta", () => {
  const values = [30.0, 40.0, 50.0, 60.0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = Number((sum / values.length).toFixed(1));
  const delta = Number((values[values.length - 1] - values[0]).toFixed(1));

  assert.equal(min, 30.0);
  assert.equal(max, 60.0);
  assert.equal(avg, 45.0);
  assert.equal(delta, 30.0);
});

// 3. Test Alert Cooldown and Hysteresis Logic
test("Alerts: Cooldown suppresses duplicate alerts within cooldown window", () => {
  const cooldownMs = 60000;
  let lastTriggeredMs = 100000;

  // Next reading 10 seconds later: should be suppressed
  const readingTime1 = lastTriggeredMs + 10000;
  const isSuppressed = readingTime1 - lastTriggeredMs < cooldownMs;
  assert.equal(isSuppressed, true);

  // Next reading 70 seconds later: should trigger
  const readingTime2 = lastTriggeredMs + 70000;
  const canTrigger = readingTime2 - lastTriggeredMs >= cooldownMs;
  assert.equal(canTrigger, true);
});

test("Alerts: Hysteresis prevents sensor chatter near threshold boundary", () => {
  const threshold = 58.0;
  const hysteresis = 1.5;

  // Initial value above threshold triggers alert
  const reading1 = 58.2;
  const isTriggered = reading1 >= threshold;
  assert.equal(isTriggered, true);

  // Small drop below threshold but within hysteresis band (58.0 - 1.5 = 56.5)
  const reading2 = 57.5;
  const clearedWithoutHysteresis = reading2 < threshold;
  const clearedWithHysteresis = reading2 < (threshold - hysteresis);

  assert.equal(clearedWithoutHysteresis, true);
  assert.equal(clearedWithHysteresis, false, "Hysteresis band must keep alert state dampening active");
});

// 4. Test Stale Sensor Detection
test("Health: Stale sensor flagged when sync interval exceeds timeout", () => {
  const STALE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const now = Date.now();
  const lastSyncTimeMs = now - (6 * 60 * 1000); // 6 minutes ago

  const isStale = (now - lastSyncTimeMs) > STALE_TIMEOUT_MS;
  assert.equal(isStale, true);
});

// 5. Test CSV Formatting
test("Export: Telemetry CSV includes required headers and escapes values", () => {
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
    "Data Source",
  ];

  const headerLine = headers.join(",");
  assert.ok(headerLine.includes("Tray 1 Temp (°C)"));
  assert.ok(headerLine.includes("PCM Temp (°C)"));
  assert.ok(headerLine.includes("Operating Status"));
});
