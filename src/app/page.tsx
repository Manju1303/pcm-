"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { OperatingModeCard } from "@/components/dashboard/OperatingModeCard";
import { SensorHealthPanel } from "@/components/dashboard/SensorHealthPanel";
import { MetricsSummaryCard } from "@/components/dashboard/MetricsSummaryCard";
import { TemperatureMultiChart, TimeFilterOption } from "@/components/dashboard/TemperatureMultiChart";
import { LatestReadingsTable } from "@/components/dashboard/LatestReadingsTable";
import { ProjectStatusCard } from "@/components/dashboard/ProjectStatusCard";
import { computePeriodMetrics } from "@/lib/metrics";
import { formatRelativeTime, formatExactDateTime } from "@/lib/utils";
import {
  Activity,
  Clock,
  AlertTriangle,
  Milestone,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const {
    currentReading,
    history,
    isOnline,
    isStale,
    isOffline,
    lastSyncTime,
    pcmConfig,
    thresholds,
    activeAlerts,
    deviceMetadata,
    featureFlags,
    projectPhases,
  } = useTelemetry();

  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>("24h");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  // Filter historical data based on time filter
  const filteredHistory = useMemo(() => {
    if (history.length === 0) return [];
    const now = Date.now();

    let cutoffMs = now - 24 * 60 * 60 * 1000;
    if (timeFilter === "1h") cutoffMs = now - 60 * 60 * 1000;
    if (timeFilter === "6h") cutoffMs = now - 6 * 60 * 60 * 1000;
    if (timeFilter === "12h") cutoffMs = now - 12 * 60 * 60 * 1000;
    if (timeFilter === "24h") cutoffMs = now - 24 * 60 * 60 * 1000;
    if (timeFilter === "7d") cutoffMs = now - 7 * 24 * 60 * 60 * 1000;

    if (timeFilter === "custom" && customStart && customEnd) {
      const startMs = new Date(customStart).getTime();
      const endMs = new Date(customEnd).getTime();
      return history.filter((r) => {
        const t = new Date(r.timestamp).getTime();
        return t >= startMs && t <= endMs;
      });
    }

    return history.filter((r) => new Date(r.timestamp).getTime() >= cutoffMs);
  }, [history, timeFilter, customStart, customEnd]);

  // Compute summary metrics for filtered period
  const periodMetrics = useMemo(() => {
    return computePeriodMetrics(filteredHistory);
  }, [filteredHistory]);

  // Calculate trends for Tray 1, Tray 2, and PCM
  const getTrendData = (sensor: "tray1" | "tray2" | "pcm") => {
    if (history.length < 2) return { trend: "steady" as const, delta: 0 };
    const latest = history[history.length - 1]?.temperatures[sensor];
    const previous = history[Math.max(0, history.length - 6)]?.temperatures[sensor];

    if (latest === null || previous === null || latest === undefined || previous === undefined) {
      return { trend: "steady" as const, delta: 0 };
    }

    const diff = latest - previous;
    if (diff > 0.2) return { trend: "rising" as const, delta: diff };
    if (diff < -0.2) return { trend: "falling" as const, delta: diff };
    return { trend: "steady" as const, delta: 0 };
  };

  const tray1Trend = getTrendData("tray1");
  const tray2Trend = getTrendData("tray2");
  const pcmTrend = getTrendData("pcm");

  const tray1Warn = thresholds?.tray1Warn ?? 82.0;
  const tray1Crit = thresholds?.tray1Crit ?? 88.0;
  const tray2Warn = thresholds?.tray2Warn ?? 80.0;
  const tray2Crit = thresholds?.tray2Crit ?? 86.0;
  const pcmWarn = thresholds?.pcmWarn ?? 54.0;
  const pcmCrit = thresholds?.pcmCrit ?? 58.0;

  const trayAvg =
    currentReading && currentReading.temperatures.tray1 !== null && currentReading.temperatures.tray2 !== null
      ? (currentReading.temperatures.tray1 + currentReading.temperatures.tray2) / 2
      : null;

  // Active Project Phase summary
  const currentPhase = projectPhases.find((p) => p.status === "In progress") ||
    projectPhases.find((p) => p.status === "Not started") ||
    projectPhases[0] || { phaseNumber: 1, title: "Hardware identification & wiring", status: "In progress" };

  return (
    <>
      <title>Overview | Agni Sakthi</title>
      <meta
        name="description"
        content="Agni Sakthi real-time solar dryer chamber telemetry, PCM latent thermal bed storage, and system safety monitoring."
      />
      <div className="space-y-6">
        {/* 1. Overview Order Item 1: 'System at a glance' row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Operating Mode Glance */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white/90 shadow-xs hover:shadow-sm transition-all">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Chamber Mode
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {currentReading?.operatingStatus ?? "Standby"}
            </div>
          </div>

          {/* Device Last Seen */}
          <div
            className="p-4 rounded-2xl border border-slate-200/80 bg-white/90 shadow-xs hover:shadow-sm transition-all cursor-help"
            title={formatExactDateTime(lastSyncTime)}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Device Last Seen
            </span>
            <div className="text-xs sm:text-sm font-bold font-mono">
              {isOffline || !lastSyncTime ? (
                <span className="text-rose-600">
                  Offline ({lastSyncTime ? formatRelativeTime(lastSyncTime) : "Never"})
                </span>
              ) : isStale ? (
                <span className="text-amber-600">
                  Stale ({formatRelativeTime(lastSyncTime)})
                </span>
              ) : (
                <span className="text-emerald-700">
                  Online ({formatRelativeTime(lastSyncTime)})
                </span>
              )}
            </div>
          </div>

          {/* Active Alerts */}
          <Link
            href="/alerts"
            className="p-4 rounded-2xl border border-slate-200/80 bg-white/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all block"
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Active Alerts
            </span>
            <div className="text-xs sm:text-sm font-bold flex items-center space-x-1.5">
              {activeAlerts.length > 0 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-600 font-mono">{activeAlerts.length} Active</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">All Clear</span>
                </>
              )}
            </div>
          </Link>

          {/* Project Phase */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white/90 shadow-xs hover:shadow-sm transition-all">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              Project Milestone
            </span>
            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Phase {currentPhase.phaseNumber}: {currentPhase.status}
            </div>
          </div>
        </div>

      {/* Operating Status Banner Card */}
      <OperatingModeCard
        mode={currentReading?.operatingStatus ?? "Unknown/Not Configured"}
        pcmConfig={pcmConfig}
        trayAvg={trayAvg}
        pcmTemp={currentReading?.temperatures.pcm ?? null}
      />

      {/* 2. Overview Order Item 2: The 3 Primary Temperature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SensorCard
          title="Tray 1 - Upper Deck"
          subtitle="Collector Air Inlet Zone"
          value={currentReading?.temperatures.tray1 ?? null}
          status={currentReading?.sensors.tray1 ?? "disconnected"}
          trend={tray1Trend.trend}
          delta={tray1Trend.delta}
          timestamp={currentReading?.timestamp ?? null}
          warnThreshold={tray1Warn}
          critThreshold={tray1Crit}
          iconType="tray1"
          romAddress={currentReading?.romAddresses?.tray1}
        />

        <SensorCard
          title="Tray 2 - Lower Deck"
          subtitle="Intermediate Exhaust Flow Zone"
          value={currentReading?.temperatures.tray2 ?? null}
          status={currentReading?.sensors.tray2 ?? "disconnected"}
          trend={tray2Trend.trend}
          delta={tray2Trend.delta}
          timestamp={currentReading?.timestamp ?? null}
          warnThreshold={tray2Warn}
          critThreshold={tray2Crit}
          iconType="tray2"
          romAddress={currentReading?.romAddresses?.tray2}
        />

        <SensorCard
          title="PCM Thermal Core"
          subtitle="Phase Change Material Storage Bed"
          value={currentReading?.temperatures.pcm ?? null}
          status={currentReading?.sensors.pcm ?? "disconnected"}
          trend={pcmTrend.trend}
          delta={pcmTrend.delta}
          timestamp={currentReading?.timestamp ?? null}
          warnThreshold={pcmWarn}
          critThreshold={pcmCrit}
          iconType="pcm"
          romAddress={currentReading?.romAddresses?.pcm}
        />
      </div>

      {/* 3. Overview Order Item 3: Multi-series Chart */}
      <TemperatureMultiChart
        data={filteredHistory}
        filter={timeFilter}
        onFilterChange={setTimeFilter}
        customStartDate={customStart}
        customEndDate={customEnd}
        onCustomDateChange={(s, e) => {
          setCustomStart(s);
          setCustomEnd(e);
        }}
        pcmPhaseChangeTemp={pcmConfig.phaseChangeTempC}
        warnThreshold={tray1Warn}
        critThreshold={tray1Crit}
      />

      {/* 4. Overview Order Item 4: Statistical Metrics */}
      <MetricsSummaryCard
        metrics={periodMetrics}
        periodLabel={
          timeFilter === "custom"
            ? "Custom Interval"
            : timeFilter === "7d"
            ? "Past 7 Days"
            : `Past ${timeFilter.toUpperCase()}`
        }
      />

      {/* Sensor & Hardware Health Diagnostics */}
      <SensorHealthPanel
        sensors={
          currentReading?.sensors ?? {
            tray1: "disconnected",
            tray2: "disconnected",
            pcm: "disconnected",
          }
        }
        batteryVoltage={currentReading?.batteryVoltage ?? null}
        buzzerState={deviceMetadata.buzzerState}
        featureFlags={featureFlags}
        moisturePercent={currentReading?.moisturePercent ?? null}
        isOnline={isOnline}
        isStale={isStale}
        isOffline={isOffline}
      />

      {/* Project Status Card (Read-only on Overview) */}
      <ProjectStatusCard phases={projectPhases} />

      {/* 5. Overview Order Item 5: Telemetry Log Table */}
      <LatestReadingsTable readings={history} />
    </div>
  </>
);
}
