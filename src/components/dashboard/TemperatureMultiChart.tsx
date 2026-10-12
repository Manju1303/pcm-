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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const raw = payload[0]?.payload;
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-1.5">
          <div className="font-mono text-slate-700 pb-1 border-b border-slate-100 flex justify-between gap-4 font-semibold">
            <span>{new Date(raw.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span className="text-[10px] text-slate-400 font-normal">{new Date(raw.timestamp).toLocaleDateString()}</span>
          </div>
          {raw.tray1 !== undefined && raw.tray1 !== null && (
            <div className="flex items-center justify-between text-sky-600 font-mono gap-4">
              <span>Tray 1 (Top):</span>
              <strong className="text-slate-900">{raw.tray1.toFixed(1)} °C</strong>
            </div>
          )}
          {raw.tray2 !== undefined && raw.tray2 !== null && (
            <div className="flex items-center justify-between text-indigo-600 font-mono gap-4">
              <span>Tray 2 (Bottom):</span>
              <strong className="text-slate-900">{raw.tray2.toFixed(1)} °C</strong>
            </div>
          )}
          {raw.pcm !== undefined && raw.pcm !== null && (
            <div className="flex items-center justify-between text-emerald-600 font-mono gap-4">
              <span>PCM Reservoir:</span>
              <strong className="text-slate-900">{raw.pcm.toFixed(1)} °C</strong>
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Top Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-sm text-slate-900">
            Live Temperature Curves (Tray 1, Tray 2, PCM)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Multi-probe temperature comparison over time
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {timeButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => onFilterChange(btn.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filter === btn.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker when selected */}
      {filter === "custom" && (
        <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <div className="flex items-center space-x-2">
            <span className="text-slate-600">From:</span>
            <input
              type="datetime-local"
              value={customStartDate || ""}
              onChange={(e) => onCustomDateChange?.(e.target.value, customEndDate || "")}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-600">To:</span>
            <input
              type="datetime-local"
              value={customEndDate || ""}
              onChange={(e) => onCustomDateChange?.(customStartDate || "", e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 font-mono"
            />
          </div>
        </div>
      )}

      {/* Series Toggle Switches */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        <span className="text-[11px] text-slate-500 uppercase font-mono mr-1">Toggles:</span>
        <button
          onClick={() => setShowTray1(!showTray1)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            showTray1
              ? "bg-sky-50 border-sky-300 text-sky-800 font-medium"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
          <span>Tray 1 (Top)</span>
        </button>

        <button
          onClick={() => setShowTray2(!showTray2)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            showTray2
              ? "bg-indigo-50 border-indigo-300 text-indigo-800 font-medium"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
          <span>Tray 2 (Bottom)</span>
        </button>

        <button
          onClick={() => setShowPcm(!showPcm)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            showPcm
              ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-medium"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>PCM Core</span>
        </button>

        <button
          onClick={() => setShowPhaseLine(!showPhaseLine)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs transition-colors ${
            showPhaseLine
              ? "bg-amber-50 border-amber-300 text-amber-800 font-medium"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          <span className="w-2.5 h-0.5 bg-amber-500 inline-block" />
          <span>Plateau ({pcmPhaseChangeTemp}°C)</span>
        </button>
      </div>

      {/* Chart or Empty Live State */}
      {chartData.length === 0 ? (
        <div className="h-72 w-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50 text-center p-6">
          <Radio className="w-8 h-8 text-slate-400 animate-pulse mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">Awaiting Live Sensor Readings</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Turn on your ESP32 controller and connect it to Wi-Fi. Incoming temperature frames will automatically graph here in real-time.
          </p>
        </div>
      ) : (
        <div className="h-72 sm:h-80 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
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

              {showPhaseLine && (
                <ReferenceLine
                  y={pcmPhaseChangeTemp}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  label={{
                    value: `PCM Plateau ${pcmPhaseChangeTemp}°C`,
                    fill: "#b45309",
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
                  stroke="#0284c7"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: "#0284c7" }}
                />
              )}

              {showTray2 && (
                <Line
                  type="monotone"
                  dataKey="tray2"
                  name="Tray 2"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: "#6366f1" }}
                />
              )}

              {showPcm && (
                <Line
                  type="monotone"
                  dataKey="pcm"
                  name="PCM Reservoir"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={false}
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
