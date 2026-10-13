"use client";

import React, { useState, useMemo } from "react";
import { TelemetryReading } from "@/types/telemetry";
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
  Calendar,
  Layers,
  Flame,
  Radio,
  SlidersHorizontal,
} from "lucide-react";

export type TimeFilterOption = "1h" | "6h" | "12h" | "24h" | "7d" | "custom";

interface TemperatureMultiChartProps {
  data: TelemetryReading[];
  filter: TimeFilterOption;
  onFilterChange: (filter: TimeFilterOption) => void;
  customStartDate?: string;
  customEndDate?: string;
  onCustomDateChange?: (start: string, end: string) => void;
  pcmPhaseChangeTemp?: number;
  warnThreshold?: number;
  critThreshold?: number;
}

export function TemperatureMultiChart({
  data,
  filter,
  onFilterChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  pcmPhaseChangeTemp = 50.0,
  warnThreshold = 58.0,
  critThreshold = 68.0,
}: TemperatureMultiChartProps) {
  const [showTray1, setShowTray1] = useState(true);
  const [showTray2, setShowTray2] = useState(true);
  const [showPcm, setShowPcm] = useState(true);
  const [showPlateauLine, setShowPlateauLine] = useState(true);
  const [showWarnLine, setShowWarnLine] = useState(false);
  const [showCritLine, setShowCritLine] = useState(false);

  const chartData = useMemo(() => {
    return data.map((d) => {
      const date = new Date(d.timestamp);
      let timeLabel = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (filter === "7d") {
        timeLabel = `${date.getMonth() + 1}/${date.getDate()} ${timeLabel}`;
      }
      return {
        timestamp: d.timestamp,
        timeLabel,
        tray1: d.sensors.tray1 === "ok" ? d.temperatures.tray1 : null,
        tray2: d.sensors.tray2 === "ok" ? d.temperatures.tray2 : null,
        pcm: d.sensors.pcm === "ok" ? d.temperatures.pcm : null,
        battery: d.batteryVoltage,
        mode: d.operatingStatus,
      };
    });
  }, [data, filter]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const raw = payload[0]?.payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs space-y-1.5">
          <div className="font-mono text-slate-700 dark:text-slate-300 pb-1 border-b border-slate-100 dark:border-slate-800 flex justify-between gap-4 font-semibold">
            <span>{new Date(raw.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span className="text-[10px] text-slate-400 font-normal">{new Date(raw.timestamp).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-400 font-mono gap-4">
            <span>Tray 1 - Upper Deck:</span>
            <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
              {raw.tray1 !== null ? `${raw.tray1.toFixed(1)}°C` : "--"}
            </strong>
          </div>
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 font-mono gap-4">
            <span>Tray 2 - Lower Deck:</span>
            <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
              {raw.tray2 !== null ? `${raw.tray2.toFixed(1)}°C` : "--"}
            </strong>
          </div>
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-mono gap-4">
            <span>PCM Thermal Core:</span>
            <strong className="text-slate-900 dark:text-slate-100 tabular-nums">
              {raw.pcm !== null ? `${raw.pcm.toFixed(1)}°C` : "--"}
            </strong>
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 font-sans">
            Mode: {raw.mode}
          </div>
        </div>
      );
    }
    return null;
  };

  const timeButtons: { id: TimeFilterOption; label: string }[] = [
    { id: "1h", label: "1H" },
    { id: "6h", label: "6H" },
    { id: "12h", label: "12H" },
    { id: "24h", label: "24H" },
    { id: "7d", label: "7D" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      {/* Top Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Temperature History
          </h3>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
          {timeButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => onFilterChange(btn.id)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                filter === btn.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker when selected */}
      {filter === "custom" && (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3 text-xs">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 dark:text-slate-400">From:</span>
            <input
              type="datetime-local"
              value={customStartDate || ""}
              onChange={(e) => onCustomDateChange?.(e.target.value, customEndDate || "")}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-600 dark:text-slate-400">To:</span>
            <input
              type="datetime-local"
              value={customEndDate || ""}
              onChange={(e) => onCustomDateChange?.(customStartDate || "", e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>
        </div>
      )}

      {/* Series and Reference Line Toggle Switches */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
        <button
          onClick={() => setShowTray1(!showTray1)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
            showTray1
              ? "bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-medium"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
          <span>Tray 1</span>
        </button>

        <button
          onClick={() => setShowTray2(!showTray2)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
            showTray2
              ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 font-medium"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          <span>Tray 2</span>
        </button>

        <button
          onClick={() => setShowPcm(!showPcm)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
            showPcm
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>PCM Core</span>
        </button>

        <button
          onClick={() => setShowPlateauLine(!showPlateauLine)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
            showPlateauLine
              ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-amber-500 inline-block" />
          <span>Plateau</span>
        </button>

        <button
          onClick={() => setShowWarnLine(!showWarnLine)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            showWarnLine
              ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-medium"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-amber-600 inline-block" />
          <span>Warn ({warnThreshold}°C)</span>
        </button>

        <button
          onClick={() => setShowCritLine(!showCritLine)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            showCritLine
              ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-medium"
              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-rose-600 inline-block" />
          <span>Crit ({critThreshold}°C)</span>
        </button>
      </div>

      {/* Chart or Empty State */}
      {chartData.length === 0 ? (
        <div className="h-72 w-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-center p-6">
          <Radio className="w-8 h-8 text-slate-400 animate-pulse mb-2" />
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Awaiting Real Telemetry</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            Incoming temperature frames from the ESP32 will automatically plot here without simulated interpolation.
          </p>
        </div>
      ) : (
        <div className="h-72 sm:h-80 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="timeLabel"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                domain={["auto", "auto"]}
                tickLine={false}
                tickFormatter={(v) => `${v}°`}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Toggleable dashed lines */}
              {showPlateauLine && (
                <ReferenceLine
                  y={pcmPhaseChangeTemp}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  label={{
                    value: `Plateau ${pcmPhaseChangeTemp}°C`,
                    fill: "#b45309",
                    fontSize: 10,
                    position: "insideTopRight",
                  }}
                />
              )}

              {showWarnLine && (
                <ReferenceLine
                  y={warnThreshold}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{
                    value: `Warn Limit ${warnThreshold}°C`,
                    fill: "#d97706",
                    fontSize: 10,
                    position: "insideTopLeft",
                  }}
                />
              )}

              {showCritLine && (
                <ReferenceLine
                  y={critThreshold}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{
                    value: `Critical Limit ${critThreshold}°C`,
                    fill: "#b91c1c",
                    fontSize: 10,
                    position: "insideTopLeft",
                  }}
                />
              )}

              {/* Lines with connectNulls={false} to ensure gaps for missing data */}
              {showTray1 && (
                <Line
                  type="monotone"
                  dataKey="tray1"
                  name="Tray 1 - Upper Deck"
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  activeDot={{ r: 5, fill: "#0284c7" }}
                />
              )}

              {showTray2 && (
                <Line
                  type="monotone"
                  dataKey="tray2"
                  name="Tray 2 - Lower Deck"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  activeDot={{ r: 5, fill: "#6366f1" }}
                />
              )}

              {showPcm && (
                <Line
                  type="monotone"
                  dataKey="pcm"
                  name="PCM Thermal Core"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={false}
                  connectNulls={false}
                  activeDot={{ r: 6, fill: "#059669" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
