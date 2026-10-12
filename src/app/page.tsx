"use client";

import React, { useState, useMemo } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { OperatingModeCard } from "@/components/dashboard/OperatingModeCard";
import { SensorHealthPanel } from "@/components/dashboard/SensorHealthPanel";
import { MetricsSummaryCard } from "@/components/dashboard/MetricsSummaryCard";
import { TemperatureMultiChart, TimeFilterOption } from "@/components/dashboard/TemperatureMultiChart";
import { LatestReadingsTable } from "@/components/dashboard/LatestReadingsTable";
import { computePeriodMetrics } from "@/lib/metrics";

export default function DashboardOverviewPage() {
  const {
    currentReading,
    history,
    isOnline,
    isStale,
    isDemoMode,
    pcmConfig,
    alertRules,
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
    const previous = history[Math.max(0, history.length - 6)]?.temperatures[sensor]; // ~1 min ago

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

  // Threshold lookup
  const tray1Warn = alertRules.find((r) => r.id === "rule-tray1-high")?.threshold ?? 58.0;
  const tray1Crit = alertRules.find((r) => r.id === "rule-tray1-crit")?.threshold ?? 68.0;
  const tray2Warn = alertRules.find((r) => r.id === "rule-tray2-high")?.threshold ?? 58.0;
  const tray2Crit = 68.0;
  const pcmWarn = alertRules.find((r) => r.id === "rule-pcm-high")?.threshold ?? 60.0;
  const pcmCrit = alertRules.find((r) => r.id === "rule-pcm-crit")?.threshold ?? 72.0;

  const trayAvg =
    currentReading && currentReading.temperatures.tray1 !== null && currentReading.temperatures.tray2 !== null
      ? (currentReading.temperatures.tray1 + currentReading.temperatures.tray2) / 2
      : null;

  return (
    <div className="space-y-6">
      {/* 1. Operating Status Banner Card */}
      <OperatingModeCard
        mode={currentReading?.operatingStatus ?? "Unknown/Not Configured"}
        pcmConfig={pcmConfig}
        trayAvg={trayAvg}
        pcmTemp={currentReading?.temperatures.pcm ?? null}
      />

      {/* 2. Primary Three Temperature Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <SensorCard
          title="Tray 1 Temperature"
          subtitle="Upper Produce Drying Deck"
          value={currentReading?.temperatures.tray1 ?? null}
          status={currentReading?.sensors.tray1 ?? "disconnected"}
          trend={tray1Trend.trend}
          delta={tray1Trend.delta}
          timestamp={currentReading?.timestamp ?? null}
          warnThreshold={tray1Warn}
          critThreshold={tray1Crit}
          iconType="tray1"
        />

        <SensorCard
          title="Tray 2 Temperature"
          subtitle="Lower Produce Drying Deck"
          value={currentReading?.temperatures.tray2 ?? null}
          status={currentReading?.sensors.tray2 ?? "disconnected"}
          trend={tray2Trend.trend}
          delta={tray2Trend.delta}
          timestamp={currentReading?.timestamp ?? null}
          warnThreshold={tray2Warn}
          critThreshold={tray2Crit}
          iconType="tray2"
        />

        <SensorCard
          title="PCM Reservoir Temp"
          subtitle="Paraffin RT-50 Storage Bed"
          value={currentReading?.temperatures.pcm ?? null}
          status={currentReading?.sensors.pcm ?? "disconnected"}
          trend={pcmTrend.trend}
          delta={pcmTrend.delta}
          timestamp={currentReading?.timestamp ?? null}
          warnThreshold={pcmWarn}
          critThreshold={pcmCrit}
          iconType="pcm"
        />
      </div>

      {/* 3. Interactive Multi-Series Temperature Line Chart */}
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
      />

      {/* 4. Statistical Metrics Summary for Selected Interval */}
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

      {/* 5. Sensor & Hardware Health Diagnostics */}
      <SensorHealthPanel
        sensors={
          currentReading?.sensors ?? {
            tray1: "disconnected",
            tray2: "disconnected",
            pcm: "disconnected",
          }
        }
        batteryVoltage={currentReading?.batteryVoltage ?? null}
        isOnline={isOnline}
        isStale={isStale}
      />

      {/* 6. Latest Telemetry Log & CSV Export */}
      <LatestReadingsTable readings={history} />
    </div>
  );
}
