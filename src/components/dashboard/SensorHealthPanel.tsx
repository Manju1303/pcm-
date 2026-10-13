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
          text: "Healthy & Active",
          color: "text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
        };
      case "stale":
        return {
          icon: Clock,
          text: "Stale (Delayed)",
          color: "text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
        };
      case "faulty":
        return {
          icon: AlertTriangle,
          text: "Faulty (85°C Reset)",
          color: "text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800",
        };
      case "out_of_range":
        return {
          icon: AlertTriangle,
          text: "Out of Range",
          color: "text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800",
        };
      case "disconnected":
      default:
        return {
          icon: XCircle,
          text: "Standby / Not Detected",
          color: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
        };
    }
  };

  const probeList = [
    {
      id: "tray1",
      name: "Tray 1 - Upper Deck",
      busDetail: "1-Wire GPIO 16 (4.7 kΩ pull-up)",
      status: isOffline ? ("disconnected" as SensorStatus) : isStale ? ("stale" as SensorStatus) : sensors.tray1,
      icon: Layers,
    },
    {
      id: "tray2",
      name: "Tray 2 - Lower Deck",
      busDetail: "1-Wire GPIO 16 (4.7 kΩ pull-up)",
      status: isOffline ? ("disconnected" as SensorStatus) : isStale ? ("stale" as SensorStatus) : sensors.tray2,
      icon: Layers,
    },
    {
      id: "pcm",
      name: "PCM Thermal Core",
      busDetail: "1-Wire GPIO 16 (4.7 kΩ pull-up)",
      status: isOffline ? ("disconnected" as SensorStatus) : isStale ? ("stale" as SensorStatus) : sensors.pcm,
      icon: Flame,
    },
  ];

  // Buzzer honest state resolution (Requirement 1)
  const buzzer1Reported = buzzerState?.buzzer1_ok;
  const buzzer2Reported = buzzerState?.buzzer2_ok;
  const hasBuzzerTelemetry = buzzer1Reported !== null && buzzer1Reported !== undefined;

  let buzzerDisplay = "Buzzers: unknown (awaiting ESP32 report)";
  let buzzerColor = "text-slate-500 dark:text-slate-400";

  if (hasBuzzerTelemetry) {
    if (buzzer1Reported && buzzer2Reported) {
      buzzerDisplay = "Hardware Armed (GPIO 25 & 26 Active)";
      buzzerColor = "text-emerald-700 dark:text-emerald-300";
    } else {
      buzzerDisplay = `Buzzer 1: ${buzzer1Reported ? "OK" : "Fault"} | Buzzer 2: ${buzzer2Reported ? "OK" : "Fault"}`;
      buzzerColor = "text-amber-700 dark:text-amber-300";
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            Sensor & Hardware Health Diagnostics
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Shared 1-Wire Bus: <strong className="text-emerald-700 dark:text-emerald-300">GPIO 16</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {probeList.map((probe) => {
          const badge = getStatusBadge(probe.status);
          const Icon = probe.icon;
          const StatusIcon = badge.icon;

          return (
            <div
              key={probe.id}
              className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{probe.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{probe.busDetail}</p>
                </div>
              </div>

              <div className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center space-x-1 ${badge.color}`}>
                <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{badge.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auxiliary Hardware Subsystems (Honest Display) */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {/* Solar Battery Voltage */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <BatteryCharging className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Solar Battery (GPIO 35):</span>
          </div>
          <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
            {featureFlags.batteryMonitorEnabled && batteryVoltage !== null && batteryVoltage !== undefined
              ? `${batteryVoltage.toFixed(2)} V`
              : "Optional / not installed"}
          </span>
        </div>

        {/* Dual Buzzers (GPIO 25/26) */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Dual Buzzers (GPIO 25/26):</span>
          </div>
          <span className={`font-mono text-xs font-medium ${buzzerColor}`}>
            {buzzerDisplay}
          </span>
        </div>

        {/* GSM Status */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
            <Radio className="w-4 h-4 text-slate-400 shrink-0" />
            <span>SIM800L GSM (UART2):</span>
          </div>
          <span className="font-mono text-slate-500 dark:text-slate-400">
            {featureFlags.gsmEnabled ? "Installed / Active" : "Optional / not installed"}
          </span>
        </div>
      </div>

      {/* Optional Moisture row if feature flag is active */}
      {featureFlags.moistureEnabled && (
        <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200">
            <Droplets className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Analog Moisture Sensor (GPIO 34): <strong>{moisturePercent !== null && moisturePercent !== undefined ? `${moisturePercent.toFixed(1)}%` : "--"}</strong></span>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 italic">
            * Note: Soil moisture sensor is not a direct food-moisture measurement unless calibrated.
          </span>
        </div>
      )}
    </div>
  );
}
