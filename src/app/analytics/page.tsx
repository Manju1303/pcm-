"use client";

import React, { useState, useMemo } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Flame,
  FileSpreadsheet,
} from "lucide-react";
import { generateTelemetryCsv, downloadCsvFile } from "@/lib/export";

export default function HistoricalAnalyticsPage() {
  const { history, pcmConfig } = useTelemetry();
  const [selectedSpan, setSelectedSpan] = useState<"24h" | "7d">("24h");

  // Calculate Tray gradient delta ($T_1 - T_2$) and PCM delta
  const analysisData = useMemo(() => {
    return history.map((r) => {
      const date = new Date(r.timestamp);
      const t1 = r.temperatures.tray1 ?? 0;
      const t2 = r.temperatures.tray2 ?? 0;
      const pcm = r.temperatures.pcm ?? 0;
      const trayGradient = Number((t1 - t2).toFixed(1));
      const pcmToTrayDelta = Number((pcm - (t1 + t2) / 2).toFixed(1));

      return {
        timestamp: r.timestamp,
        timeLabel: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tray1: t1,
        tray2: t2,
        pcm,
        trayGradient,
        pcmToTrayDelta,
      };
    });
  }, [history]);

  const handleExport = () => {
    const csv = generateTelemetryCsv(history);
    downloadCsvFile(csv, "solar-dryer-historical-analytics.csv");
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <LineChartIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Historical Thermal Analytics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Investigating temperature distribution gradients, convective drying efficiency, and PCM heat exchange dynamics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedSpan("24h")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedSpan === "24h" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setSelectedSpan("7d")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedSpan === "7d" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              7 Days
            </button>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Chart 1: Deck Gradient (Tray 1 vs Tray 2 Delta) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="font-semibold text-sm text-slate-200 mb-1">
          Tray Thermal Gradient (Tray 1 − Tray 2)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Shows difference in heating between the top deck (inlet) and bottom deck (exhaust). A positive delta represents drying heat being absorbed by produce on Tray 1.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analysisData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientTray" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stop-color="#38bdf8" stop-opacity={0.4} />
                  <stop offset="95%" stop-color="#38bdf8" stop-opacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}°`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.5rem" }}
              />
              <Area
                type="monotone"
                dataKey="trayGradient"
                name="Deck Gradient (°C)"
                stroke="#38bdf8"
                fillOpacity={1}
                fill="url(#gradientTray)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: PCM Thermal Advantage Delta */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="font-semibold text-sm text-slate-200 mb-1">
          PCM Thermal Reservoir Margin (PCM Temp − Mean Tray Temp)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Positive values indicate the PCM is hotter than the drying chamber, actively releasing stored latent heat to prolong nighttime dehydration.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analysisData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientPcm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stop-color="#10b981" stop-opacity={0.4} />
                  <stop offset="95%" stop-color="#10b981" stop-opacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}°`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.5rem" }}
              />
              <Area
                type="monotone"
                dataKey="pcmToTrayDelta"
                name="PCM Margin (°C)"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#gradientPcm)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
