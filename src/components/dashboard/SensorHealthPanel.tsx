"use client";

import React from "react";
import { SensorStatusSet, SensorStatus, BuzzerState, FeatureFlags } from "@/types/telemetry";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Cpu,
  BatteryCharging,
  Radio,
  Layers,
  Flame,
  Droplets,
  HelpCircle,
} from "lucide-react";

interface SensorHealthPanelProps {
  sensors: SensorStatusSet;
  batteryVoltage?: number | null;
  buzzerState?: BuzzerState;
  featureFlags?: FeatureFlags;
  moisturePercent?: number | null;
  isOnline: boolean;
  isStale: boolean;
  isOffline: boolean;
}

export function SensorHealthPanel({
  sensors,
  batteryVoltage,
  buzzerState,
  featureFlags = { gsmEnabled: false, moistureEnabled: false, batteryMonitorEnabled: false },
  moisturePercent,
  isOnline,
  isStale,
  isOffline,
}: SensorHealthPanelProps) {
  const getStatusBadge = (status: SensorStatus) => {
    switch (status) {
      case "ok":
        return {
          icon: CheckCircle2,
          text: "Operational",
          color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        };
      case "stale":
        return {
          icon: Clock,
          text: "Stale",
          color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
        };
      case "faulty":
      case "out_of_range":
        return {
          icon: AlertTriangle,
          text: "Sensor Fault",
          color: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
        };
      case "disconnected":
      default:
        return {
          icon: XCircle,
          text: "Standby",
          color: "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
        };
    }
  };

  const probeList = [
    {
      id: "tray1",
      name: "Tray 1",
      status: isOffline ? ("disconnected" as SensorStatus) : isStale ? ("stale" as SensorStatus) : sensors.tray1,
      icon: Layers,
    },
    {
      id: "tray2",
      name: "Tray 2",
      status: isOffline ? ("disconnected" as SensorStatus) : isStale ? ("stale" as SensorStatus) : sensors.tray2,
      icon: Layers,
    },
    {
      id: "pcm",
      name: "PCM Core",
      status: isOffline ? ("disconnected" as SensorStatus) : isStale ? ("stale" as SensorStatus) : sensors.pcm,
      icon: Flame,
    },
  ];

  const buzzer1Reported = buzzerState?.buzzer1_ok;
  const buzzer2Reported = buzzerState?.buzzer2_ok;
  const hasBuzzerTelemetry = buzzer1Reported !== null && buzzer1Reported !== undefined;

  let buzzerDisplay = "Awaiting Report";
  let buzzerColor = "text-slate-500 dark:text-slate-400";

  if (hasBuzzerTelemetry) {
    if (buzzer1Reported && buzzer2Reported) {
      buzzerDisplay = "Ready";
      buzzerColor = "text-emerald-700 dark:text-emerald-300";
    } else {
      buzzerDisplay = "Fault Detected";
      buzzerColor = "text-amber-700 dark:text-amber-300";
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Hardware Health
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {probeList.map((probe) => {
          const badge = getStatusBadge(probe.status);
          const Icon = probe.icon;
          const StatusIcon = badge.icon;

          return (
            <div
              key={probe.id}
              className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200/80 dark:border-slate-600 shadow-2xs">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{probe.name}</h4>
              </div>

              <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center space-x-1 ${badge.color}`}>
                <StatusIcon className="w-3 h-3 shrink-0" />
                <span>{badge.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auxiliary Hardware Subsystems */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {/* Solar Battery Voltage */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <BatteryCharging className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Battery:</span>
          </div>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {featureFlags.batteryMonitorEnabled && batteryVoltage !== null && batteryVoltage !== undefined
              ? `${batteryVoltage.toFixed(2)} V`
              : "Not installed"}
          </span>
        </div>

        {/* Dual Buzzers */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Alert Buzzer:</span>
          </div>
          <span className={`font-mono text-xs font-medium ${buzzerColor}`}>
            {buzzerDisplay}
          </span>
        </div>

        {/* GSM Status */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <Radio className="w-4 h-4 text-slate-400 shrink-0" />
            <span>GSM:</span>
          </div>
          <span className="font-mono text-slate-500 dark:text-slate-400">
            {featureFlags.gsmEnabled ? "Active" : "Not installed"}
          </span>
        </div>
      </div>

      {featureFlags.moistureEnabled && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200">
            <Droplets className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Moisture Sensor: <strong>{moisturePercent !== null && moisturePercent !== undefined ? `${moisturePercent.toFixed(1)}%` : "--"}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
