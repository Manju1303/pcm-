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
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Calendar,
  Layers,
  Flame,
  Maximize2,
  Minimize2,
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
}

export function TemperatureMultiChart({
  data,
  filter,
  onFilterChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
  pcmPhaseChangeTemp = 50.0,
}: TemperatureMultiChartProps) {
  const [showTray1, setShowTray1] = useState(true);
  const [showTray2, setShowTray2] = useState(true);
  const [showPcm, setShowPcm] = useState(true);
  const [showPhaseLine, setShowPhaseLine] = useState(true);

  // Format and filter data for Recharts
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
        tray1: d.temperatures.tray1,
        tray2: d.temperatures.tray2,
        pcm: d.temperatures.pcm,
        battery: d.batteryVoltage,
        mode: d.operatingStatus,
      };
    });
  }, [data, filter]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const raw = payload[0]?.payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
          <div className="font-mono text-slate-300 pb-1 border-b border-slate-800 flex justify-between gap-4">
            <span>{new Date(raw.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span className="text-[10px] text-slate-500">{new Date(raw.timestamp).toLocaleDateString()}</span>
          </div>
          {raw.tray1 !== undefined && raw.tray1 !== null && (
            <div className="flex items-center justify-between text-sky-400 font-mono gap-4">
              <span>Tray 1 (Top):</span>
              <strong className="text-slate-100">{raw.tray1.toFixed(1)} °C</strong>
            </div>
          )}
          {raw.tray2 !== undefined && raw.tray2 !== null && (
            <div className="flex items-center justify-between text-indigo-400 font-mono gap-4">
              <span>Tray 2 (Bottom):</span>
              <strong className="text-slate-100">{raw.tray2.toFixed(1)} °C</strong>
            </div>
          )}
          {raw.pcm !== undefined && raw.pcm !== null && (
            <div className="flex items-center justify-between text-emerald-400 font-mono gap-4">
              <span>PCM Reservoir:</span>
              <strong className="text-slate-100">{raw.pcm.toFixed(1)} °C</strong>
            </div>
          )}
          {raw.mode && (
            <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
              Operating: <span className="text-slate-200">{raw.mode}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const timeButtons: { id: TimeFilterOption; label: string }[] = [
    { id: "1h", label: "1 Hour" },
    { id: "6h", label: "6 Hours" },
    { id: "12h", label: "12 Hours" },
    { id: "24h", label: "24 Hours" },
    { id: "7d", label: "7 Days" },
    { id: "custom", label: "Custom" },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
      {/* Top Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-sm text-slate-200">
            Multi-Probe Temperature Comparison Over Time
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time multi-series comparison: Tray 1, Tray 2, and PCM Thermal Bed
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center flex-wrap gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          {timeButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => onFilterChange(btn.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filter === btn.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker when selected */}
      {filter === "custom" && (
        <div className="mb-4 p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">From:</span>
            <input
              type="datetime-local"
              value={customStartDate || ""}
              onChange={(e) => onCustomDateChange?.(e.target.value, customEndDate || "")}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">To:</span>
            <input
              type="datetime-local"
              value={customEndDate || ""}
              onChange={(e) => onCustomDateChange?.(customStartDate || "", e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
            />
          </div>
        </div>
      )}

      {/* Series Toggle Switches */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        <span className="text-[11px] text-slate-400 uppercase font-mono mr-1">Toggles:</span>
        <button
          onClick={() => setShowTray1(!showTray1)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            showTray1
              ? "bg-sky-950/70 border-sky-600/70 text-sky-300"
              : "bg-slate-900 border-slate-800 text-slate-500"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
          <span>Tray 1 (Top)</span>
        </button>

        <button
          onClick={() => setShowTray2(!showTray2)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            showTray2
              ? "bg-indigo-950/70 border-indigo-600/70 text-indigo-300"
              : "bg-slate-900 border-slate-800 text-slate-500"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />
          <span>Tray 2 (Bottom)</span>
        </button>

        <button
          onClick={() => setShowPcm(!showPcm)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            showPcm
              ? "bg-emerald-950/70 border-emerald-600/70 text-emerald-300"
              : "bg-slate-900 border-slate-800 text-slate-500"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          <span>PCM Thermal Core</span>
        </button>

        <button
          onClick={() => setShowPhaseLine(!showPhaseLine)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            showPhaseLine
              ? "bg-amber-950/70 border-amber-600/70 text-amber-300"
              : "bg-slate-900 border-slate-800 text-slate-500"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
          <span>Phase-Change ({pcmPhaseChangeTemp}°C)</span>
        </button>
      </div>

      {/* Interactive Chart Container */}
      <div className="h-72 sm:h-80 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={["auto", "auto"]}
              tickLine={false}
              tickFormatter={(v) => `${v}°`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* PCM Latent Phase Change Reference Plateau Line */}
            {showPhaseLine && (
              <ReferenceLine
                y={pcmPhaseChangeTemp}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: `PCM Plateau ${pcmPhaseChangeTemp}°C`,
                  fill: "#fbbf24",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
            )}

            {showTray1 && (
              <Line
                type="monotone"
                dataKey="tray1"
                name="Tray 1"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#38bdf8" }}
              />
            )}

            {showTray2 && (
              <Line
                type="monotone"
                dataKey="tray2"
                name="Tray 2"
                stroke="#818cf8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#818cf8" }}
              />
            )}

            {showPcm && (
              <Line
                type="monotone"
                dataKey="pcm"
                name="PCM Thermal Reservoir"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: "#10b981" }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
