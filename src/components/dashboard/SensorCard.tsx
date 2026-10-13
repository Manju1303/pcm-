"use client";

import React from "react";
import { SensorStatus } from "@/types/telemetry";
import { formatTime, formatTempUnit } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  AlertTriangle,
  Flame,
  Layers,
  Thermometer,
  XCircle,
  Clock,
} from "lucide-react";

interface SensorCardProps {
  title: string;
  subtitle: string;
  value: number | null;
  status: SensorStatus;
  trend: "rising" | "falling" | "steady";
  delta: number;
  timestamp: string | null;
  warnThreshold: number;
  critThreshold: number;
  iconType: "tray1" | "tray2" | "pcm";
  romAddress?: string | null;
}

export function SensorCard({
  title,
  subtitle,
  value,
  status,
  trend,
  delta,
  timestamp,
  warnThreshold,
  critThreshold,
  iconType,
  romAddress,
}: SensorCardProps) {
  const isDisconnected = status === "disconnected" || value === null;
  const isFaulty = status === "faulty" || status === "out_of_range";
  const isStale = status === "stale";
  const isCritical = !isDisconnected && !isFaulty && !isStale && value !== null && value >= critThreshold;
  const isWarning = !isDisconnected && !isFaulty && !isStale && value !== null && value >= warnThreshold && !isCritical;
  const isNormal = !isDisconnected && !isFaulty && !isStale && !isWarning && !isCritical;

  const renderIcon = () => {
    switch (iconType) {
      case "tray1":
        return <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case "tray2":
        return <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case "pcm":
        return <Flame className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Thermometer className="w-5 h-5 text-slate-500" />;
    }
  };

  let borderStyle = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
  let statusBadgeColor = "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
  let statusText = "Awaiting Data";
  let StatusIcon = Thermometer;

  if (isDisconnected) {
    statusBadgeColor = "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    statusText = "Disconnected";
    StatusIcon = XCircle;
  } else if (isFaulty) {
    borderStyle = "border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20";
    statusBadgeColor = "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
    statusText = "Sensor Fault";
    StatusIcon = AlertTriangle;
  } else if (isStale) {
    borderStyle = "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 opacity-80";
    statusBadgeColor = "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300";
    statusText = "Stale (Delayed)";
    StatusIcon = Clock;
  } else if (isCritical) {
    borderStyle = "border-rose-400 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-950/30 border-critical-pulse";
    statusBadgeColor = "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 font-bold";
    statusText = "Critical High";
    StatusIcon = AlertCircle;
  } else if (isWarning) {
    borderStyle = "border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/20";
    statusBadgeColor = "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-semibold";
    statusText = "Warning High";
    StatusIcon = AlertTriangle;
  } else {
    borderStyle = "border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900";
    statusBadgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300";
    statusText = "Active & Normal";
    StatusIcon = Thermometer;
  }

  return (
    <div className={`relative rounded-xl border p-5 shadow-xs transition-all duration-200 ${borderStyle}`}>
      {/* Top row: Title and Status pill */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {renderIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* Status Pill with icon + text */}
        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${statusBadgeColor} flex items-center space-x-1`}>
          <StatusIcon className="w-3 h-3 inline shrink-0" />
          <span>{statusText}</span>
        </span>
      </div>

      {/* Main Temperature Display (Tabular Numbers) */}
      <div className="mt-4 flex items-baseline justify-between">
        <div className="flex items-baseline space-x-1">
          {isDisconnected ? (
            <span className="text-4xl tabular-nums font-mono font-bold text-slate-400 dark:text-slate-600 tracking-tight">--</span>
          ) : isStale ? (
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl tabular-nums font-mono font-bold text-slate-400 dark:text-slate-500 tracking-tight">
                {value?.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase">
                Stale
              </span>
            </div>
          ) : (
            <span className={`text-4xl tabular-nums font-mono font-bold tracking-tight ${
              isCritical ? "text-rose-600 dark:text-rose-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"
            }`}>
              {value?.toFixed(1)}
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400 font-mono text-lg">°C</span>
        </div>

        {/* Trend Indicator */}
        {!isDisconnected && !isStale && (
          <div className="flex items-center space-x-1 text-xs">
            {trend === "rising" && (
              <span className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{Math.abs(delta).toFixed(1)}°
              </span>
            )}
            {trend === "falling" && (
              <span className="flex items-center text-sky-600 dark:text-sky-400 font-medium">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                -{Math.abs(delta).toFixed(1)}°
              </span>
            )}
            {trend === "steady" && (
              <span className="flex items-center text-slate-500 dark:text-slate-400 font-medium">
                <Minus className="w-3.5 h-3.5 mr-0.5" />
                Steady
              </span>
            )}
          </div>
        )}
      </div>

      {/* Range Bar Indicator */}
      <div className="mt-3">
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isStale
                ? "bg-slate-400"
                : isCritical
                ? "bg-rose-500"
                : isWarning
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{
              width: isDisconnected
                ? "0%"
                : `${Math.min(100, Math.max(0, ((value! - 20) / (warnThreshold + 10 - 20)) * 100))}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
          <span>20°C</span>
          <span>Warn: {warnThreshold}°C</span>
          <span>Crit: {critThreshold}°C</span>
        </div>
      </div>

      {/* Bottom Footer: Timestamp & ROM Address */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="font-mono text-[10px]">
          {romAddress ? `ROM: ${romAddress.slice(0, 8)}...` : "ROM: Unassigned"}
        </span>
        <span className="font-mono text-slate-700 dark:text-slate-300">
          {timestamp ? formatTime(timestamp) : "--:--:--"}
        </span>
      </div>
    </div>
  );
}
