"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  LineChart as LineChartIcon,
  FileSpreadsheet,
  Radio,
  SlidersHorizontal,
  Calendar,
} from "lucide-react";
import { generateTelemetryCsv, downloadCsvFile } from "@/lib/export";
import { computePeriodMetrics } from "@/lib/metrics";
import { formatTemp, formatTempUnit } from "@/lib/utils";

export type RangeOption = "1h" | "6h" | "12h" | "24h" | "7d" | "custom";

function AnalyticsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { history, thresholds, pcmConfig } = useTelemetry();

  // Read range from URL search params (Requirement 17)
  const rangeParam = (searchParams.get("range") as RangeOption) || "24h";
  const [selectedSpan, setSelectedSpan] = useState<RangeOption>(rangeParam);
  const [customStart, setCustomStart] = useState<string>(searchParams.get("start") || "");
  const [customEnd, setCustomEnd] = useState<string>(searchParams.get("end") || "");

  // Toggleable reference lines
  const [showWarn, setShowWarn] = useState(false);
  const [showCrit, setShowCrit] = useState(false);
  const [showPlateau, setShowPlateau] = useState(true);

  // Sync state with URL params
  const handleRangeChange = (newRange: RangeOption) => {
    setSelectedSpan(newRange);
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", newRange);
    if (newRange !== "custom") {
      params.delete("start");
      params.delete("end");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    params.set("start", start);
    params.set("end", end);
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    if (history.length === 0) return [];
    const now = Date.now();

    let cutoffMs = now - 24 * 60 * 60 * 1000;
    if (selectedSpan === "1h") cutoffMs = now - 60 * 60 * 1000;
    if (selectedSpan === "6h") cutoffMs = now - 6 * 60 * 60 * 1000;
    if (selectedSpan === "12h") cutoffMs = now - 12 * 60 * 60 * 1000;
    if (selectedSpan === "24h") cutoffMs = now - 24 * 60 * 60 * 1000;
    if (selectedSpan === "7d") cutoffMs = now - 7 * 24 * 60 * 60 * 1000;

    if (selectedSpan === "custom" && customStart && customEnd) {
      const s = new Date(customStart).getTime();
      const e = new Date(customEnd).getTime();
      return history.filter((r) => {
        const t = new Date(r.timestamp).getTime();
        return t >= s && t <= e;
      });
    }

    return history.filter((r) => new Date(r.timestamp).getTime() >= cutoffMs);
  }, [history, selectedSpan, customStart, customEnd]);

  // Compute stats
  const metrics = useMemo(() => {
    return computePeriodMetrics(filteredData);
  }, [filteredData]);

  // Chart data formatting with gaps for missing data (connectNulls=false)
  const chartData = useMemo(() => {
    return filteredData.map((r) => {
      const date = new Date(r.timestamp);
      let timeLabel = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (selectedSpan === "7d") {
        timeLabel = `${date.getMonth() + 1}/${date.getDate()} ${timeLabel}`;
      }

      return {
        timestamp: r.timestamp,
        timeLabel,
        tray1: r.sensors.tray1 === "ok" ? r.temperatures.tray1 : null,
        tray2: r.sensors.tray2 === "ok" ? r.temperatures.tray2 : null,
        pcm: r.sensors.pcm === "ok" ? r.temperatures.pcm : null,
        status: r.operatingStatus,
      };
    });
  }, [filteredData, selectedSpan]);

  const handleExport = () => {
    const csv = generateTelemetryCsv(filteredData);
    downloadCsvFile(csv, `solar-dryer-analytics-${selectedSpan}.csv`);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const raw = payload[0]?.payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl text-xs space-y-1.5 font-mono">
          <div className="text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800 font-sans flex justify-between gap-4 font-semibold">
            <span>{new Date(raw.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span className="text-[10px] text-slate-400 font-normal">{new Date(raw.timestamp).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-300 gap-4">
            <span>Tray 1 - Upper Deck:</span>
            <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
              {raw.tray1 !== null ? `${raw.tray1.toFixed(1)}°C` : "--"}
            </strong>
          </div>
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 gap-4">
            <span>Tray 2 - Lower Deck:</span>
            <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
              {raw.tray2 !== null ? `${raw.tray2.toFixed(1)}°C` : "--"}
            </strong>
          </div>
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 gap-4">
            <span>PCM Thermal Core:</span>
            <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
              {raw.pcm !== null ? `${raw.pcm.toFixed(1)}°C` : "--"}
            </strong>
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 font-sans">
            Operating Mode: {raw.status}
          </div>
        </div>
      );
    }
    return null;
  };

  const warnTray = thresholds?.tray1Warn ?? 58.0;
  const critTray = thresholds?.tray1Crit ?? 68.0;
  const plateauPcm = pcmConfig?.phaseChangeTempC ?? 50.0;

  return (
    <>
      <title>Thermal Analytics | Agni Sakthi</title>
      <meta
        name="description"
        content="Historical temperature analytics, multi-range trend analysis, and CSV export for Agni Sakthi solar dryer."
      />
      <div className="space-y-6">
        {/* Title & Range Controls */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <LineChartIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Thermal Analytics & Multi-Range History
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Statistical trends, diurnal curves, and sensor frame analytics.
            </p>
          </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range Buttons (Synced with URL) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
            {(["1h", "6h", "12h", "24h", "7d", "custom"] as RangeOption[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedSpan === r
                    ? "bg-emerald-600 text-white shadow-2xs font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {filteredData.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Pickers */}
      {selectedSpan === "custom" && (
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3 text-xs">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 dark:text-slate-400">Start:</span>
            <input
              type="datetime-local"
              value={customStart}
              onChange={(e) => handleCustomDateChange(e.target.value, customEnd)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 dark:text-slate-400">End:</span>
            <input
              type="datetime-local"
              value={customEnd}
              onChange={(e) => handleCustomDateChange(customStart, e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>
        </div>
      )}

      {/* Summary Min / Avg / Max Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tray 1 */}
        <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <span className="text-xs font-bold uppercase text-sky-700 dark:text-sky-300">
            Tray 1 - Upper Deck
          </span>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Min</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatTemp(metrics.tray1.min)}°C</span>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Avg</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatTemp(metrics.tray1.avg)}°C</span>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Max</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatTemp(metrics.tray1.max)}°C</span>
            </div>
          </div>
        </div>

        {/* Tray 2 */}
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <span className="text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300">
            Tray 2 - Lower Deck
          </span>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Min</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatTemp(metrics.tray2.min)}°C</span>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Avg</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatTemp(metrics.tray2.avg)}°C</span>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Max</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatTemp(metrics.tray2.max)}°C</span>
            </div>
          </div>
        </div>

        {/* PCM */}
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
          <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
            PCM Thermal Core
          </span>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Min</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatTemp(metrics.pcm.min)}°C</span>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Avg</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatTemp(metrics.pcm.avg)}°C</span>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Max</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatTemp(metrics.pcm.max)}°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Series Line Chart */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            Multi-Probe Thermal Response Curves
          </h3>

          {/* Toggleable dashed lines */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setShowPlateau(!showPlateau)}
              className={`px-2 py-1 rounded text-[11px] border font-mono transition-colors ${
                showPlateau
                  ? "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200"
              }`}
            >
              Plateau ({plateauPcm}°C)
            </button>
            <button
              onClick={() => setShowWarn(!showWarn)}
              className={`px-2 py-1 rounded text-[11px] border font-mono transition-colors ${
                showWarn
                  ? "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200"
              }`}
            >
              Warn ({warnTray}°C)
            </button>
            <button
              onClick={() => setShowCrit(!showCrit)}
              className={`px-2 py-1 rounded text-[11px] border font-mono transition-colors ${
                showCrit
                  ? "bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200"
              }`}
            >
              Crit ({critTray}°C)
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-xs">
            <Radio className="w-8 h-8 mb-2 animate-pulse" />
            <span>Awaiting telemetry readings for the selected range</span>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={["auto", "auto"]} tickLine={false} tickFormatter={(v) => `${v}°`} />
                <Tooltip content={<CustomTooltip />} />

                {showPlateau && (
                  <ReferenceLine
                    y={plateauPcm}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    label={{ value: `Plateau (${plateauPcm}°C)`, fill: "#b45309", fontSize: 10, position: "insideTopRight" }}
                  />
                )}

                {showWarn && (
                  <ReferenceLine
                    y={warnTray}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    label={{ value: `Warn (${warnTray}°C)`, fill: "#d97706", fontSize: 10, position: "insideTopLeft" }}
                  />
                )}

                {showCrit && (
                  <ReferenceLine
                    y={critTray}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{ value: `Crit (${critTray}°C)`, fill: "#b91c1c", fontSize: 10, position: "insideTopLeft" }}
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="tray1"
                  name="Tray 1 - Upper Deck"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="tray2"
                  name="Tray 2 - Lower Deck"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="pcm"
                  name="PCM Thermal Core"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  </>
);
}

export default function HistoricalAnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-mono">Loading analytics...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
