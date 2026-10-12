"use client";

import React from "react";
import { SensorStatus } from "@/types/telemetry";
import { formatTime } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
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
  // Determine state level
  const isDisconnected = status === "disconnected" || status === "faulty" || value === null;
  const isStale = status === "stale";
  const isCritical = !isDisconnected && value !== null && value >= critThreshold;
  const isWarning = !isDisconnected && value !== null && value >= warnThreshold && !isCritical;
  const isNormal = !isDisconnected && !isWarning && !isCritical;

  // Icon chooser
  const renderIcon = () => {
    switch (iconType) {
      case "tray1":
        return <Layers className="w-5 h-5 text-sky-400" />;
      case "tray2":
        return <Layers className="w-5 h-5 text-indigo-400" />;
      case "pcm":
        return <Flame className="w-5 h-5 text-emerald-400" />;
      default:
        return <Thermometer className="w-5 h-5 text-slate-400" />;
    }
  };

  // Card theme styling
  let borderStyle = "border-slate-800 bg-slate-900/80";
  let statusBadgeColor = "bg-slate-800 text-slate-400 border-slate-700";
  let statusText = "Disconnected";
  let glowStyle = "";

  if (isDisconnected) {
    statusBadgeColor = "bg-slate-800 text-slate-400 border-slate-700";
    statusText = status === "faulty" ? "Sensor Fault" : "Disconnected";
  } else if (isStale) {
    borderStyle = "border-amber-500/40 bg-slate-900/80";
    statusBadgeColor = "bg-amber-950/70 text-amber-300 border-amber-800/60";
    statusText = "Stale (No Ping)";
  } else if (isCritical) {
    borderStyle = "border-rose-500/60 bg-rose-950/20";
    statusBadgeColor = "bg-rose-950 text-rose-300 border-rose-800 animate-pulse";
    statusText = "Critical High";
    glowStyle = "shadow-lg shadow-rose-950/50";
  } else if (isWarning) {
    borderStyle = "border-amber-500/50 bg-amber-950/15";
    statusBadgeColor = "bg-amber-950 text-amber-300 border-amber-800";
    statusText = "Warning High";
  } else {
    borderStyle = "border-slate-800 hover:border-slate-700 bg-slate-900/80";
    statusBadgeColor = "bg-emerald-950/80 text-emerald-300 border-emerald-800/60";
    statusText = "Valid & Active";
  }

  return (
    <div className={`relative rounded-xl border p-5 transition-all duration-200 ${borderStyle} ${glowStyle}`}>
      {/* Top row: Title and Status pill */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60">
            {renderIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 text-sm tracking-tight">{title}</h3>
            <p className="text-[11px] text-slate-400">{subtitle}</p>
          </div>
        </div>

        {/* Status Pill */}
        <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${statusBadgeColor} flex items-center space-x-1`}>
          {isNormal && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
          {isWarning && <AlertTriangle className="w-3 h-3 text-amber-400 inline" />}
          {isCritical && <AlertCircle className="w-3 h-3 text-rose-400 inline" />}
          <span>{statusText}</span>
        </span>
      </div>

      {/* Main Temperature Display */}
      <div className="mt-4 flex items-baseline justify-between">
        <div className="flex items-baseline space-x-1">
          {isDisconnected ? (
            <span className="text-3xl font-mono font-bold text-slate-500 tracking-tight">--.-</span>
          ) : (
            <span className={`text-4xl font-mono font-bold tracking-tight ${
              isCritical ? "text-rose-400" : isWarning ? "text-amber-400" : "text-slate-100"
            }`}>
              {value?.toFixed(1)}
            </span>
          )}
          <span className="text-slate-400 font-mono text-lg">°C</span>
        </div>

        {/* Trend Indicator */}
        {!isDisconnected && (
          <div className="flex items-center space-x-1 text-xs">
            {trend === "rising" && (
              <span className="flex items-center text-amber-400">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                +{Math.abs(delta).toFixed(1)}°
              </span>
            )}
            {trend === "falling" && (
              <span className="flex items-center text-sky-400">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                -{Math.abs(delta).toFixed(1)}°
              </span>
            )}
            {trend === "steady" && (
              <span className="flex items-center text-slate-400">
                <Minus className="w-3.5 h-3.5 mr-0.5" />
                Steady
              </span>
            )}
          </div>
        )}
      </div>

      {/* Range Bar Indicator */}
      <div className="mt-3">
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical
                ? "bg-rose-500"
                : isWarning
                ? "bg-amber-500"
                : "bg-gradient-to-r from-emerald-500 to-teal-400"
            }`}
            style={{
              width: isDisconnected
                ? "0%"
                : `${Math.min(100, Math.max(0, ((value! - 20) / (warnThreshold + 10 - 20)) * 100))}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
          <span>20°C</span>
          <span>Warn: {warnThreshold}°C</span>
          <span>Crit: {critThreshold}°C</span>
        </div>
      </div>

      {/* Bottom Footer: Timestamp */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>Updated:</span>
        <span className="font-mono text-slate-400">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}
