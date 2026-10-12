"use client";

import React, { useState, useMemo } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  LineChart as LineChartIcon,
  FileSpreadsheet,
  Radio,
} from "lucide-react";
import { generateTelemetryCsv, downloadCsvFile } from "@/lib/export";

export default function HistoricalAnalyticsPage() {
  const { history } = useTelemetry();
  const [selectedSpan, setSelectedSpan] = useState<"24h" | "7d">("24h");

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
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <LineChartIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Historical Thermal Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Investigating temperature distribution gradients, convective drying efficiency, and PCM heat exchange dynamics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedSpan("24h")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedSpan === "24h" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setSelectedSpan("7d")}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                selectedSpan === "7d" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              7 Days
            </button>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {analysisData.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-white">
          <Radio className="w-8 h-8 text-slate-400 animate-pulse mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">Awaiting Telemetry for Analytics</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Data will populate automatically as soon as the ESP32 begins reporting sensor frames.
          </p>
        </div>
      ) : (
        <>
          {/* Chart 1: Deck Gradient */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5">
            <h3 className="font-semibold text-sm text-slate-900 mb-1">
              Tray Thermal Gradient (Tray 1 − Tray 2)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Temperature difference between the top deck (inlet) and bottom deck (exhaust).
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysisData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientTray" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}°`} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }} />
                  <Area
                    type="monotone"
                    dataKey="trayGradient"
                    name="Deck Gradient (°C)"
                    stroke="#0284c7"
                    fillOpacity={1}
                    fill="url(#gradientTray)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: PCM Margin */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5">
            <h3 className="font-semibold text-sm text-slate-900 mb-1">
              PCM Thermal Reservoir Margin (PCM Temp − Mean Tray Temp)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Positive values indicate the PCM is hotter than the drying chamber, actively releasing stored latent heat.
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysisData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientPcm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v}°`} />
                  <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "0.5rem" }} />
                  <Area
                    type="monotone"
                    dataKey="pcmToTrayDelta"
                    name="PCM Margin (°C)"
                    stroke="#059669"
                    fillOpacity={1}
                    fill="url(#gradientPcm)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
