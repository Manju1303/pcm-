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
import { Flame, ShieldAlert, Sparkles, Layers, Info } from "lucide-react";

export default function PcmThermalStoragePage() {
  const { currentReading, history, pcmConfig, updatePcmConfig } = useTelemetry();

  const pcmChartData = useMemo(() => {
    return history.map((r) => {
      const date = new Date(r.timestamp);
      return {
        timestamp: r.timestamp,
        timeLabel: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pcm: r.temperatures.pcm,
        tray1: r.temperatures.tray1,
        tray2: r.temperatures.tray2,
        mode: r.operatingStatus,
      };
    });
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">
            PCM Thermal Energy Storage & Latent Heat Monitoring
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Detailed thermodynamics of the Phase Change Material (PCM) bed. Tracks isothermal charging plateaus and nocturnal heat release.
        </p>
      </div>

      {/* PCM Temperature Graph with Phase Plateau Reference */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-slate-200">
              PCM Core Temperature Profile vs Phase Transition Thresholds
            </h3>
            <p className="text-[11px] text-slate-400">
              Yellow dashed line indicates melting point ({pcmConfig.phaseChangeTempC}°C)
            </p>
          </div>
          <span className="font-mono text-xs text-emerald-400 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800/60">
            Current: {currentReading?.temperatures.pcm?.toFixed(1) ?? "--"}°C
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pcmChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timeLabel" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} domain={[20, 75]} tickLine={false} tickFormatter={(v) => `${v}°`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.5rem" }}
              />
              <ReferenceLine
                y={pcmConfig.phaseChangeTempC}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: `Melting Plateau (${pcmConfig.phaseChangeTempC}°C)`,
                  fill: "#fbbf24",
                  fontSize: 10,
                  position: "insideTopLeft",
                }}
              />
              <ReferenceLine
                y={pcmConfig.chargeStartTempC}
                stroke="#34d399"
                strokeDasharray="2 2"
                label={{
                  value: `Charge Start (${pcmConfig.chargeStartTempC}°C)`,
                  fill: "#34d399",
                  fontSize: 10,
                  position: "insideBottomLeft",
                }}
              />
              <Line
                type="monotone"
                dataKey="pcm"
                name="PCM Temperature"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="tray1"
                name="Tray 1 (Top Deck)"
                stroke="#38bdf8"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scientific Explainer and Calibration Tool */}
      <PcmThermalExplainer
        currentPcmTemp={currentReading?.temperatures.pcm ?? null}
        config={pcmConfig}
        onUpdateConfig={updatePcmConfig}
      />
    </div>
  );
}
