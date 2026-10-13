"use client";

import React from "react";
import { PeriodSummaryMetrics } from "@/types/telemetry";
import { formatTemp } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

interface MetricsSummaryCardProps {
  metrics: PeriodSummaryMetrics;
  periodLabel: string;
}

export function MetricsSummaryCard({
  metrics,
  periodLabel,
}: MetricsSummaryCardProps) {
  const sensors = [
    {
      id: "tray1",
      name: "Tray 1",
      data: metrics.tray1,
      color: "text-amber-800 dark:text-amber-300",
      accent: "border-amber-200/80 dark:border-amber-800",
    },
    {
      id: "tray2",
      name: "Tray 2",
      data: metrics.tray2,
      color: "text-indigo-800 dark:text-indigo-300",
      accent: "border-indigo-200/80 dark:border-indigo-800",
    },
    {
      id: "pcm",
      name: "PCM Core",
      data: metrics.pcm,
      color: "text-emerald-800 dark:text-emerald-300",
      accent: "border-emerald-200/80 dark:border-emerald-800",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Metrics Summary
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
          {periodLabel} • {metrics.count} samples
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sensors.map((sensor) => (
          <div
            key={sensor.id}
            className={`p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border ${sensor.accent} space-y-2`}
          >
            <h4 className={`text-xs font-bold uppercase tracking-wider ${sensor.color}`}>
              {sensor.name}
            </h4>

            <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono text-xs">
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Min</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatTemp(sensor.data.min)}{sensor.data.min !== null ? "°C" : ""}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Avg</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatTemp(sensor.data.avg)}{sensor.data.avg !== null ? "°C" : ""}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">Max</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatTemp(sensor.data.max)}{sensor.data.max !== null ? "°C" : ""}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200/80 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 block uppercase">&Delta;</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatTemp(sensor.data.delta)}{sensor.data.delta !== null ? "°" : ""}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
