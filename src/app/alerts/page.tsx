"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatExactDateTime, formatRelativeTime } from "@/lib/utils";
import {
  BellRing,
  AlertTriangle,
  Bell,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  CheckCircle2,
  Lock,
  Filter,
  Info,
  Clock,
  WifiOff,
} from "lucide-react";
import { requestBrowserNotificationPermission } from "@/lib/alerts-engine";
import { AlertEvent } from "@/types/telemetry";

type AlertFilter = "all" | "warning" | "critical" | "fault" | "offline" | "acknowledged";

export default function AlertsSafetyPage() {
  const {
    activeAlerts,
    alertHistory,
    faultHistory,
    acknowledgeAlert,
    clearAllActiveAlerts,
    deviceMetadata,
    isAdmin,
  } = useTelemetry();

  const [filter, setFilter] = useState<AlertFilter>("all");
  const [notificationStatus, setNotificationStatus] = useState<string>("default");
  const [ackLoadingId, setAckLoadingId] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    const granted = await requestBrowserNotificationPermission();
    setNotificationStatus(granted ? "granted" : "denied");
  };

  const handleAcknowledge = async (alertId: string) => {
    if (!isAdmin) return;
    setAckLoadingId(alertId);
    try {
      await acknowledgeAlert(alertId);
    } finally {
      setAckLoadingId(null);
    }
  };

  // Combine and deduplicate history & active alerts for complete event log
  const allEvents = useMemo(() => {
    const map = new Map<string, AlertEvent>();
    activeAlerts.forEach((a) => map.set(a.id, a));
    alertHistory.forEach((a) => {
      if (!map.has(a.id)) map.set(a.id, a);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [activeAlerts, alertHistory]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((item) => {
      if (filter === "all") return true;
      if (filter === "warning") return item.severity === "warning";
      if (filter === "critical") return item.severity === "critical";
      if (filter === "offline") return item.severity === "offline" || item.id.includes("offline");
      if (filter === "fault") return item.severity === "fault" || item.id.includes("fault");
      if (filter === "acknowledged") return item.status === "acknowledged";
      return true;
    });
  }, [allEvents, filter]);

  const bzState = deviceMetadata.buzzerState;
  const buzzerKnown = bzState?.buzzer1_ok !== null && bzState?.buzzer1_ok !== undefined;

  return (
    <>
      <title>Alerts & Safety | Agni Sakthi</title>
      <meta
        name="description"
        content="Real-time threshold alert monitoring, sensor fault logs, buzzer fail-safe diagnostics, and event acknowledgment."
      />

      <div className="space-y-6">
        {/* Title Header */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <BellRing className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Alerts, Thresholds & Dual-Buzzer Safety
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time threshold surveillance for drying trays, PCM core, power supply, and offline disconnection alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestPermission}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{notificationStatus === "granted" ? "Notifications Enabled" : "Enable Browser Notifications"}</span>
            </button>
          </div>
        </div>

        {/* Hardware Dual Buzzer Status */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                Autonomous Dual-Buzzer Protection (GPIO 25 Warning / GPIO 26 Critical)
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Local audible alerts operate autonomously on ESP32 hardware without cloud latency.
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] px-2.5 py-1 rounded font-mono font-medium shrink-0 ${
              buzzerKnown
                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {buzzerKnown ? "Active Telemetry" : "Hardware Armed"}
          </span>
        </div>

        {/* Active Critical & Warning Alerts Section */}
        {activeAlerts.length > 0 && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 animate-bounce" />
                <h2 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                  Active Alerts ({activeAlerts.length})
                </h2>
              </div>
              {!isAdmin && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Login as Admin to Acknowledge
                </span>
              )}
            </div>

            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-lg border bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    alert.severity === "critical"
                      ? "border-rose-300 dark:border-rose-800"
                      : alert.severity === "offline"
                      ? "border-rose-200 dark:border-rose-900"
                      : "border-amber-300 dark:border-amber-800"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {alert.severity === "critical" ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    ) : alert.severity === "offline" ? (
                      <WifiOff className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            alert.severity === "critical" || alert.severity === "offline"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {alert.source}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          • {formatRelativeTime(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                        {alert.message}
                      </p>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                        Measured Value: <strong>{alert.value !== null && alert.value !== undefined ? `${alert.value.toFixed(1)}°C` : "--"}</strong> | Threshold Limit: <strong>{alert.threshold !== null && alert.threshold !== undefined ? `${alert.threshold.toFixed(1)}°C` : "--"}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center self-end sm:self-center">
                    {isAdmin ? (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={ackLoadingId === alert.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs transition-colors disabled:opacity-50"
                      >
                        {ackLoadingId === alert.id ? "Acknowledging..." : "Acknowledge"}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Read-only
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Event History */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Alert Event History & Audit Log
              </h2>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "warning", label: "Warning" },
                  { id: "critical", label: "Critical" },
                  { id: "fault", label: "Fault" },
                  { id: "offline", label: "Offline" },
                  { id: "acknowledged", label: "Acknowledged" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    filter === tab.id
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Source Channel</th>
                  <th className="py-2.5 px-3">Value</th>
                  <th className="py-2.5 px-3">Threshold</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                        {formatExactDateTime(event.timestamp)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            event.severity === "critical" || event.severity === "offline"
                              ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                              : event.severity === "warning"
                              ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {event.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {event.source}
                      </td>
                      <td className="py-2.5 px-3 font-bold tabular-nums">
                        {event.value !== null && event.value !== undefined
                          ? `${event.value.toFixed(1)}°C`
                          : "--"}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-500 dark:text-slate-400">
                        {event.threshold !== null && event.threshold !== undefined
                          ? `${event.threshold.toFixed(1)}°C`
                          : "--"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            event.status === "acknowledged"
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {event.status === "active" ? (
                          isAdmin ? (
                            <button
                              onClick={() => handleAcknowledge(event.id)}
                              className="px-2 py-1 rounded text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                            >
                              Acknowledge
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Login required</span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400 font-sans">
                            {event.acknowledgedAt ? formatExactDateTime(event.acknowledgedAt) : "Acknowledged"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                      No alert events matching the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout (Item 23 & 24) */}
          <div className="md:hidden space-y-2.5">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        event.severity === "critical" || event.severity === "offline"
                          ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {event.severity}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {event.source}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    {event.message}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                    <div>
                      Val: <strong>{event.value?.toFixed(1)}°C</strong> | Limit: <strong>{event.threshold?.toFixed(1)}°C</strong>
                    </div>
                    <div>
                      {event.status === "active" && isAdmin ? (
                        <button
                          onClick={() => handleAcknowledge(event.id)}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-sans"
                        >
                          Ack
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 capitalize">{event.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                No alert events found for this filter.
              </div>
            )}
          </div>
        </div>

        {/* Item 10: Sensor Faults Diagnostic Section with Timestamps in Alerts */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center space-x-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Sensor Bus Fault History
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Hardware 1-Wire communication errors and probe faults registered by the system.
          </p>

          {faultHistory && faultHistory.length > 0 ? (
            <div className="space-y-2">
              {faultHistory.map((fault) => (
                <div
                  key={fault.id}
                  className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                      {fault.faultType}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase">
                      {fault.sensor}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      - {fault.message}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    {formatExactDateTime(fault.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
              No hardware probe faults on record.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
