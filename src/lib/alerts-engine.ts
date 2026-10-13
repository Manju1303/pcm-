import { AlertRule, AlertEvent, TelemetryReading, SensorFaultEvent } from "@/types/telemetry";

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: "rule-tray1-high",
    sensor: "tray1",
    condition: "gt",
    threshold: 82.0,
    hysteresis: 1.5,
    cooldownMs: 60000,
    severity: "warning",
    message: "Tray 1 temperature exceeded safe operational threshold (82.0°C)",
    enabled: true,
  },
  {
    id: "rule-tray1-crit",
    sensor: "tray1",
    condition: "gt",
    threshold: 88.0,
    hysteresis: 2.0,
    cooldownMs: 30000,
    severity: "critical",
    message: "CRITICAL: Tray 1 severe overheat! Potential crop scorch risk (88.0°C)",
    enabled: true,
  },
  {
    id: "rule-tray2-high",
    sensor: "tray2",
    condition: "gt",
    threshold: 80.0,
    hysteresis: 1.5,
    cooldownMs: 60000,
    severity: "warning",
    message: "Tray 2 temperature exceeded safe operational threshold (80.0°C)",
    enabled: true,
  },
  {
    id: "rule-tray2-crit",
    sensor: "tray2",
    condition: "gt",
    threshold: 86.0,
    hysteresis: 2.0,
    cooldownMs: 30000,
    severity: "critical",
    message: "CRITICAL: Tray 2 severe overheat! Potential crop scorch risk (86.0°C)",
    enabled: true,
  },
  {
    id: "rule-pcm-high",
    sensor: "pcm",
    condition: "gt",
    threshold: 54.0,
    hysteresis: 1.0,
    cooldownMs: 45000,
    severity: "warning",
    message: "PCM temperature above standard operational ceiling (54.0°C)",
    enabled: true,
  },
  {
    id: "rule-pcm-crit",
    sensor: "pcm",
    condition: "gt",
    threshold: 58.0,
    hysteresis: 1.5,
    cooldownMs: 30000,
    severity: "critical",
    message: "CRITICAL: PCM thermal reservoir safety cutoff breached! (58.0°C)",
    enabled: true,
  },
  {
    id: "rule-battery-low",
    sensor: "batteryVoltage",
    condition: "lt",
    threshold: 11.8,
    hysteresis: 0.3,
    cooldownMs: 120000,
    severity: "warning",
    message: "Solar battery reserve voltage low (< 11.8 V)",
    enabled: true,
  },
];

// Cooldown timestamp registry (ruleId -> lastTriggeredTimestampMs)
const alertCooldowns: Record<string, number> = {};

/**
 * Evaluates active reading against configured rules, observing hysteresis and cooldowns.
 */
export function evaluateTelemetryAlerts(
  reading: TelemetryReading,
  rules: AlertRule[] = DEFAULT_ALERT_RULES,
  currentTimeMs: number = Date.now()
): AlertEvent[] {
  const triggeredEvents: AlertEvent[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    let sensorVal: number | null = null;
    let isStaleOrInvalid = false;

    if (rule.sensor === "tray1") {
      sensorVal = reading.temperatures.tray1;
      isStaleOrInvalid = reading.sensors.tray1 !== "ok" || sensorVal === null;
    } else if (rule.sensor === "tray2") {
      sensorVal = reading.temperatures.tray2;
      isStaleOrInvalid = reading.sensors.tray2 !== "ok" || sensorVal === null;
    } else if (rule.sensor === "pcm") {
      sensorVal = reading.temperatures.pcm;
      isStaleOrInvalid = reading.sensors.pcm !== "ok" || sensorVal === null;
    } else if (rule.sensor === "batteryVoltage") {
      sensorVal = reading.batteryVoltage ?? null;
      isStaleOrInvalid = sensorVal === null;
    }

    if (isStaleOrInvalid || sensorVal === null) {
      continue;
    }

    let conditionMet = false;
    if (rule.condition === "gt") {
      conditionMet = sensorVal >= rule.threshold;
    } else if (rule.condition === "lt") {
      conditionMet = sensorVal <= rule.threshold;
    }

    if (conditionMet) {
      const lastTriggered = alertCooldowns[rule.id] || 0;
      if (currentTimeMs - lastTriggered >= rule.cooldownMs) {
        alertCooldowns[rule.id] = currentTimeMs;

        triggeredEvents.push({
          id: `alert-${rule.id}-${currentTimeMs}`,
          ruleId: rule.id,
          sensor: rule.sensor,
          severity: rule.severity,
          value: sensorVal,
          threshold: rule.threshold,
          message: rule.message,
          timestamp: new Date(currentTimeMs).toISOString(),
          status: "active",
        });
      }
    }
  }

  // Also convert any detected sensor faults into warning/critical alert events
  if (reading.faults && reading.faults.length > 0) {
    for (const fault of reading.faults) {
      const faultKey = `fault-alert-${fault.sensor}-${fault.faultType}`;
      const lastTriggered = alertCooldowns[faultKey] || 0;
      if (currentTimeMs - lastTriggered >= 60000) {
        alertCooldowns[faultKey] = currentTimeMs;
        triggeredEvents.push({
          id: `alert-${faultKey}-${currentTimeMs}`,
          sensor: fault.sensor,
          severity: fault.faultType === "disconnected" || fault.faultType === "out_of_range" ? "critical" : "warning",
          value: fault.rawValue ?? undefined,
          message: `FAULT: ${fault.message}`,
          timestamp: fault.timestamp,
          status: "active",
        });
      }
    }
  }

  return triggeredEvents;
}

/**
 * Creates a device offline alert event
 */
export function createDeviceOfflineAlert(lastSeenIso: string | null): AlertEvent {
  const now = new Date().toISOString();
  return {
    id: `alert-device-offline-${Date.now()}`,
    sensor: "device",
    severity: "critical",
    message: `Device offline: No telemetry frame received within send window (last seen: ${
      lastSeenIso ? new Date(lastSeenIso).toLocaleTimeString() : "Never"
    })`,
    timestamp: now,
    status: "active",
  };
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
}

export function sendBrowserNotification(title: string, body: string, severity: "warning" | "critical") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(`[${severity.toUpperCase()}] ${title}`, {
        body,
        icon: "/icons/icon-192x192.svg",
        badge: "/icons/icon-192x192.svg",
        tag: `dryer-${Date.now()}`,
      });
    } catch (e) {
      console.warn("Browser notification error:", e);
    }
  }
}
