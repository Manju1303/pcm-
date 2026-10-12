"use client";

import React from "react";
import { SensorStatus } from "@/types/telemetry";
import { formatTime } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  AlertTriangle,
  Flame,
  Layers,
  Thermometer,
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
}: SensorCardProps) {
  const isDisconnected = status === "disconnected" || status === "faulty" || value === null;
  const isStale = status === "stale";
  const isCritical = !isDisconnected && value !== null && value >= critThreshold;
  const isWarning = !isDisconnected && value !== null && value >= warnThreshold && !isCritical;
  const isNormal = !isDisconnected && !isWarning && !isCritical;

  const renderIcon = () => {
    switch (iconType) {
      case "tray1":
        return <Layers className="w-5 h-5 text-sky-600" />;
      case "tray2":
        return <Layers className="w-5 h-5 text-indigo-600" />;
      case "pcm":
        return <Flame className="w-5 h-5 text-emerald-600" />;
      default:
        return <Thermometer className="w-5 h-5 text-slate-500" />;
    }
  };

  let borderStyle = "border-slate-200 bg-white";
  let statusBadgeColor = "bg-slate-100 text-slate-600 border-slate-200";
  let statusText = "Awaiting Data";

  if (isDisconnected) {
    statusBadgeColor = "bg-slate-100 text-slate-500 border-slate-200";
    statusText = status === "faulty" ? "Sensor Fault" : "Awaiting Data";
  } else if (isStale) {
    borderStyle = "border-amber-300 bg-white";
    statusBadgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    statusText = "Stale (No Ping)";
  } else if (isCritical) {
    borderStyle = "border-rose-300 bg-rose-50/30";
    statusBadgeColor = "bg-rose-50 text-rose-700 border-rose-300 animate-pulse";
    statusText = "Critical High";
  } else if (isWarning) {
    borderStyle = "border-amber-300 bg-amber-50/20";
    statusBadgeColor = "bg-amber-50 text-amber-700 border-amber-200";
    statusText = "Warning High";
  } else {
    borderStyle = "border-slate-200 bg-white";
    statusBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    statusText = "Active & Normal";
  }

  return (
    <div className={`relative rounded-xl border p-5 shadow-xs transition-all duration-200 ${borderStyle}`}>
      {/* Top row: Title and Status pill */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
            {renderIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>

        {/* Status Pill */}
        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${statusBadgeColor} flex items-center space-x-1`}>
          {isNormal && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
          {isWarning && <AlertTriangle className="w-3 h-3 text-amber-500 inline" />}
          {isCritical && <AlertCircle className="w-3 h-3 text-rose-500 inline" />}
          <span>{statusText}</span>
        </span>
      </div>

      {/* Main Temperature Display */}
      <div className="mt-4 flex items-baseline justify-between">
        <div className="flex items-baseline space-x-1">
          {isDisconnected ? (
            <span className="text-4xl font-mono font-bold text-slate-400 tracking-tight">--.-</span>
          ) : (
            <span className={`text-4xl font-mono font-bold tracking-tight ${
              isCritical ? "text-rose-600" : isWarning ? "text-amber-600" : "text-slate-900"
            }`}>
              {value?.toFixed(1)}
            </span>
          )}
          <span className="text-slate-500 font-mono text-lg">°C</span>
        </div>

        {/* Trend Indicator */}
        {!isDisconnected && (
          <div className="flex items-center space-x-1 text-xs">
            {trend === "rising" && (
              <span className="flex items-center text-amber-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{Math.abs(delta).toFixed(1)}°
              </span>
            )}
            {trend === "falling" && (
              <span className="flex items-center text-sky-600 font-medium">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                -{Math.abs(delta).toFixed(1)}°
              </span>
            )}
            {trend === "steady" && (
              <span className="flex items-center text-slate-500 font-medium">
                <Minus className="w-3.5 h-3.5 mr-0.5" />
                Steady
              </span>
            )}
          </div>
        )}
      </div>

      {/* Range Bar Indicator */}
      <div className="mt-3">
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical
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
        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
          <span>20°C</span>
          <span>Warn: {warnThreshold}°C</span>
          <span>Crit: {critThreshold}°C</span>
        </div>
      </div>

      {/* Bottom Footer: Timestamp */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Updated:</span>
        <span className="font-mono text-slate-700">
          {timestamp ? formatTime(timestamp) : "--:--:--"}
        </span>
      </div>
    </div>
  );
}
