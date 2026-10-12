import { AlertRule, AlertEvent, TelemetryReading } from "@/types/telemetry";

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: "rule-tray1-high",
    sensor: "tray1",
    condition: "gt",
    threshold: 58.0,
    hysteresis: 1.5,
    cooldownMs: 60000, // 1 minute cooldown
    severity: "warning",
    message: "Tray 1 temperature exceeded safe drying threshold (58.0°C)",
    enabled: true,
  },
  {
    id: "rule-tray1-crit",
    sensor: "tray1",
    condition: "gt",
    threshold: 68.0,
    hysteresis: 2.0,
    cooldownMs: 30000,
    severity: "critical",
    message: "CRITICAL: Tray 1 severe overheat! Potential crop scorch risk (68.0°C)",
    enabled: true,
  },
  {
    id: "rule-tray2-high",
    sensor: "tray2",
    condition: "gt",
    threshold: 58.0,
    hysteresis: 1.5,
    cooldownMs: 60000,
    severity: "warning",
    message: "Tray 2 temperature exceeded safe drying threshold (58.0°C)",
    enabled: true,
  },
  {
    id: "rule-pcm-high",
    sensor: "pcm",
    condition: "gt",
    threshold: 60.0,
    hysteresis: 2.0,
    cooldownMs: 45000,
    severity: "warning",
    message: "PCM temperature above standard operational ceiling (60.0°C)",
    enabled: true,
  },
  {
    id: "rule-pcm-crit",
    sensor: "pcm",
    condition: "gt",
    threshold: 72.0,
    hysteresis: 2.0,
    cooldownMs: 30000,
    severity: "critical",
    message: "CRITICAL: PCM thermal reservoir thermal safety cutoff breached! (72.0°C)",
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
 * Stale or disconnected sensor data is rejected from evaluating as 'normal'.
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

    // Skip if sensor reading is invalid / disconnected
    if (isStaleOrInvalid || sensorVal === null) {
      continue;
    }

    // Check condition with hysteresis
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

  return triggeredEvents;
}

/**
 * Requests browser notification permission gracefully
 */
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

/**
 * Fires native browser notification if granted
 */
export function sendBrowserNotification(title: string, body: string, severity: "warning" | "critical") {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      new Notification(`[${severity.toUpperCase()}] ${title}`, {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        tag: `dryer-${Date.now()}`,
      });
    } catch (e) {
      console.warn("Browser notification could not be delivered", e);
    }
  }
}
