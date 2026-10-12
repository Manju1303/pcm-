"use client";

import React, { useState } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { AlertRule } from "@/types/telemetry";
import { formatDate, formatTime } from "@/lib/utils";
import {
  BellRing,
  AlertTriangle,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { requestBrowserNotificationPermission } from "@/lib/alerts-engine";

export default function AlertsConfigPage() {
  const {
    alertRules,
    activeAlerts,
    alertHistory,
    updateAlertRules,
    acknowledgeAlert,
    clearAllActiveAlerts,
  } = useTelemetry();

  const [notificationStatus, setNotificationStatus] = useState<string>("default");
  const [rulesState, setRulesState] = useState<AlertRule[]>(alertRules);

  const handleRequestPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    setNotificationStatus(granted ? "granted" : "denied");
  };

  const handleToggleRule = (id: string) => {
    const updated = rulesState.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setRulesState(updated);
    updateAlertRules(updated);
  };

  const handleThresholdChange = (id: string, newThreshold: number) => {
    const updated = rulesState.map((r) =>
      r.id === id ? { ...r, threshold: newThreshold } : r
    );
    setRulesState(updated);
    updateAlertRules(updated);
  };

  const handleHysteresisChange = (id: string, newHysteresis: number) => {
    const updated = rulesState.map((r) =>
      r.id === id ? { ...r, hysteresis: newHysteresis } : r
    );
    setRulesState(updated);
    updateAlertRules(updated);
  };

  const handleCooldownChange = (id: string, newCooldownSec: number) => {
    const updated = rulesState.map((r) =>
      r.id === id ? { ...r, cooldownMs: newCooldownSec * 1000 } : r
    );
    setRulesState(updated);
    updateAlertRules(updated);
  };

  return (
    <div className="space-y-6">
      {/* Title & Notification Permission */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BellRing className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Alerts, Thresholds & Dual-Buzzer Configuration
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Independent limits for Tray 1, Tray 2, PCM, and solar battery. Hysteresis and cooldown timers prevent alert chatter.
          </p>
        </div>

        <button
          onClick={handleRequestPermission}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Enable Browser Notifications</span>
        </button>
      </div>

      {/* Hardware Dual Buzzer Fail-safe Callout */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs flex items-start space-x-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-emerald-900">ESP32 Hardware Autonomous Alert Resilience</h4>
          <p className="text-slate-700 mt-0.5 leading-relaxed">
            Local buzzers connected to <strong>GPIO 25 (Warning)</strong> and <strong>GPIO 26 (Critical)</strong> evaluate sensor limits directly on the ESP32 microcontroller in real-time. If Wi-Fi drops, backend servers stall, or the browser is closed, audible local protection remains 100% active.
          </p>
        </div>
      </div>

      {/* Active Alerts List */}
      {activeAlerts.length > 0 && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
              <h3 className="font-bold text-sm text-rose-900">
                Active Alarms ({activeAlerts.length})
              </h3>
            </div>
            <button
              onClick={clearAllActiveAlerts}
              className="text-xs text-rose-700 hover:text-rose-900 px-2 py-1 rounded bg-white border border-rose-200 shadow-2xs font-medium"
            >
              Acknowledge All
            </button>
          </div>

          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-white border border-rose-200 flex items-center justify-between text-xs shadow-2xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        alert.severity === "critical"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <strong className="text-slate-900">{alert.message}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Sensor Value: <span className="text-rose-600 font-bold">{alert.value.toFixed(1)}</span> (Limit: {alert.threshold.toFixed(1)}) • Triggered: {formatTime(alert.timestamp)}
                  </div>
                </div>

                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs border border-slate-200"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threshold Configuration Rules Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-semibold text-sm text-slate-900 mb-3">
          Configurable Sensor Thresholds, Hysteresis & Cooldowns
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Rule Name & Sensor</th>
                <th className="py-2.5 px-3">Condition</th>
                <th className="py-2.5 px-3">Threshold</th>
                <th className="py-2.5 px-3">Hysteresis</th>
                <th className="py-2.5 px-3">Cooldown</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3 text-right">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {rulesState.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3">
                    <span className="font-sans font-medium text-slate-900 block">{rule.message}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{rule.sensor}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {rule.condition === "gt" ? "Exceeds (>)" : "Drops Below (<)"}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="0.5"
                      value={rule.threshold}
                      onChange={(e) => handleThresholdChange(rule.id, parseFloat(e.target.value) || 0)}
                      className="w-16 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-emerald-700 font-bold"
                    />
                    <span className="ml-1 text-slate-500">
                      {rule.sensor === "batteryVoltage" ? "V" : "°C"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="0.1"
                      value={rule.hysteresis}
                      onChange={(e) => handleHysteresisChange(rule.id, parseFloat(e.target.value) || 0)}
                      className="w-14 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-slate-800"
                    />
                    <span className="ml-1 text-slate-500">
                      {rule.sensor === "batteryVoltage" ? "V" : "°C"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      step="5"
                      value={rule.cooldownMs / 1000}
                      onChange={(e) => handleCooldownChange(rule.id, parseInt(e.target.value) || 10)}
                      className="w-14 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-slate-800"
                    />
                    <span className="ml-1 text-slate-500">sec</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        rule.severity === "critical"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {rule.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`px-2 py-1 rounded text-[10px] font-sans font-bold transition-colors ${
                        rule.enabled
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {rule.enabled ? "ACTIVE" : "MUTED"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Alert Log */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-semibold text-sm text-slate-900 mb-3">
          Historical Alert Log
        </h3>

        {alertHistory.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 font-sans">
            No historical alarms logged. All parameters operating within normal thresholds.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {alertHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-500 text-[11px]">{formatDate(item.timestamp)}</span>
                    <strong className="text-slate-800">{item.message}</strong>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Recorded: {item.value.toFixed(1)} (Threshold: {item.threshold.toFixed(1)})
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
