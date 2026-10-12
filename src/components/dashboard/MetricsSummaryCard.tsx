"use client";

import React from "react";
import { PeriodSummaryMetrics } from "@/types/telemetry";
import {
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

interface MetricsSummaryCardProps {
  metrics: PeriodSummaryMetrics;
  periodLabel: string;
}

export function MetricsSummaryCard({
  metrics,
  periodLabel,
}: MetricsSummaryCardProps) {
  const renderSensorSummary = (
    name: string,
    colorClass: string,
    data: { min: number; max: number; avg: number; delta: number }
  ) => {
    const isPositive = data.delta > 0;
    const isZero = data.delta === 0;

    return (
      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold ${colorClass}`}>{name}</span>
          <div className="flex items-center space-x-1 text-xs">
            {isPositive ? (
              <span className="flex items-center text-amber-700 font-mono font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{data.delta}°C
              </span>
            ) : isZero ? (
              <span className="flex items-center text-slate-500 font-mono font-medium">
                <Minus className="w-3.5 h-3.5" />
                0.0°C
              </span>
            ) : (
              <span className="flex items-center text-sky-700 font-mono font-medium">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {data.delta}°C
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200 font-mono">
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Min</div>
            <div className="text-xs font-semibold text-slate-800">{data.min}°C</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Avg</div>
            <div className="text-xs font-bold text-slate-900">{data.avg}°C</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Max</div>
            <div className="text-xs font-semibold text-slate-800">{data.max}°C</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-sm text-slate-900">
            Thermal Statistical Metrics ({periodLabel})
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Recorded Frames: <strong className="text-slate-800">{metrics.count}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {renderSensorSummary("Tray 1 (Top Deck)", "text-sky-700", metrics.tray1)}
        {renderSensorSummary("Tray 2 (Bottom Deck)", "text-indigo-700", metrics.tray2)}
        {renderSensorSummary("PCM Thermal Reservoir", "text-emerald-700", metrics.pcm)}
      </div>
    </div>
  );
}
