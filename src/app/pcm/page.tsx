"use client";

import React, { useMemo } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { PcmThermalExplainer } from "@/components/pcm/PcmThermalExplainer";
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
import { Flame, Radio, Moon, Clock, CheckCircle2 } from "lucide-react";
import { formatTime, formatDate, formatTemp } from "@/lib/utils";

export default function PcmThermalStoragePage() {
  const { currentReading, history, pcmConfig, updatePcmConfig, nightTests, isAdmin } = useTelemetry();

  const pcmChartData = useMemo(() => {
    return history.map((r) => {
      const date = new Date(r.timestamp);
      return {
        timestamp: r.timestamp,
        timeLabel: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pcm: r.sensors.pcm === "ok" ? r.temperatures.pcm : null,
        tray1: r.sensors.tray1 === "ok" ? r.temperatures.tray1 : null,
        tray2: r.sensors.tray2 === "ok" ? r.temperatures.tray2 : null,
        mode: r.operatingStatus,
      };
    });
  }, [history]);

  return (
    <>
      <title>PCM Thermal Storage | Agni Sakthi</title>
      <meta
        name="description"
        content="Phase change material thermal storage performance, latent heat curves, and nocturnal release monitoring."
      />
      <div className="space-y-6">
        {/* Title */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
              PCM Thermal Storage
            </h1>
          </div>
        </div>

      {/* PCM Temperature Graph with Phase Plateau Reference */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              PCM Temperature Curve
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Plateau: {pcmConfig.phaseChangeTempC}°C
            </p>
          </div>
          <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
            Current: {currentReading?.sensors.pcm === "ok" && currentReading?.temperatures.pcm !== null ? `${currentReading.temperatures.pcm.toFixed(1)}°C` : "--"}
          </span>
        </div>

        {pcmChartData.length === 0 ? (
          <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-center p-6">
            <Radio className="w-8 h-8 text-slate-400 animate-pulse mb-2" />
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Awaiting PCM Probe Readings</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Connect your DS18B20 PCM thermal core probe. Real-time temperature curves will plot here automatically.
            </p>
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pcmChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[20, 85]} tickLine={false} tickFormatter={(v) => `${v}°`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <ReferenceLine
                  y={pcmConfig.phaseChangeTempC}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  label={{
                    value: `Melting Plateau (${pcmConfig.phaseChangeTempC}°C)`,
                    fill: "#b45309",
                    fontSize: 10,
                    position: "insideTopLeft",
                  }}
                />
                <ReferenceLine
                  y={pcmConfig.chargeStartTempC}
                  stroke="#059669"
                  strokeDasharray="2 2"
                  label={{
                    value: `Charge Start (${pcmConfig.chargeStartTempC}°C)`,
                    fill: "#047857",
                    fontSize: 10,
                    position: "insideBottomLeft",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pcm"
                  name="PCM Thermal Core"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="tray1"
                  name="Tray 1 - Upper Deck"
                  stroke="#0284c7"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Scientific Explainer & Theoretical Capacity */}
      <PcmThermalExplainer
        currentPcmTemp={currentReading?.temperatures.pcm ?? null}
        config={pcmConfig}
        onUpdateConfig={updatePcmConfig}
        isAdmin={isAdmin}
      />

      {/* Night Test Results Section (Requirement 2) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Night Test Results (Thermal Discharge Validation)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Computed strictly from stored telemetry frames. Measures duration PCM maintained temperature above tray mean.
            </p>
          </div>
        </div>

        {nightTests.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No Night Discharge Tests Recorded Yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              This section remains empty until an overnight test run has been performed with real hardware telemetry logged.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {nightTests.map((test) => (
              <div
                key={test.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatDate(test.startTime)} – {formatTime(test.endTime)}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold">
                      VERIFIED RUN
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1">
                    {test.notes || "Standard nocturnal cooling run."}
                  </p>
                </div>

                <div className="text-right font-mono">
                  <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                    {test.durationHours} Hours ({test.durationMinutes} min)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    PCM Mean Margin: +{test.pcmAvgAboveTrayDeltaC.toFixed(1)}°C
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </>
);
}
