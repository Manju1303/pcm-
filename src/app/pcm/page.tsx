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
import { Flame, Radio } from "lucide-react";

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
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            PCM Thermal Energy Storage & Latent Heat Monitoring
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Detailed thermodynamics of the Phase Change Material (PCM) bed. Tracks isothermal charging plateaus and nocturnal heat release.
        </p>
      </div>

      {/* PCM Temperature Graph with Phase Plateau Reference */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm text-slate-900">
              PCM Core Temperature Profile vs Phase Transition Thresholds
            </h3>
            <p className="text-[11px] text-slate-500">
              Amber line indicates nominal melting plateau ({pcmConfig.phaseChangeTempC}°C)
            </p>
          </div>
          <span className="font-mono text-xs text-emerald-700 font-semibold px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200">
            Current: {currentReading?.temperatures.pcm ? `${currentReading.temperatures.pcm.toFixed(1)}°C` : "--.-°C"}
          </span>
        </div>

        {pcmChartData.length === 0 ? (
          <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg bg-slate-50 text-center p-6">
            <Radio className="w-8 h-8 text-slate-400 animate-pulse mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">Awaiting PCM Probe Readings</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Connect your DS18B20 PCM core probe. Real-time temperature curves will plot here automatically.
            </p>
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pcmChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="timeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[20, 75]} tickLine={false} tickFormatter={(v) => `${v}°`} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "0.5rem", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }} />
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
                  name="PCM Temperature"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="tray1"
                  name="Tray 1 (Top Deck)"
                  stroke="#0284c7"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
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
