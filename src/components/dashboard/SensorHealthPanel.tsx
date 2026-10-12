"use client";

import React from "react";
import { SensorStatusSet, SensorStatus } from "@/types/telemetry";
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
} from "lucide-react";

interface SensorHealthPanelProps {
  sensors: SensorStatusSet;
  batteryVoltage?: number | null;
  isOnline: boolean;
  isStale: boolean;
}

export function SensorHealthPanel({
  sensors,
  batteryVoltage,
  isOnline,
  isStale,
}: SensorHealthPanelProps) {
  const getStatusBadge = (status: SensorStatus) => {
    switch (status) {
      case "ok":
        return {
          icon: CheckCircle2,
          text: "Valid / Healthy",
          color: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
        };
      case "stale":
        return {
          icon: Clock,
          text: "Stale (Delayed)",
          color: "text-amber-400 bg-amber-950/60 border-amber-800/60",
        };
      case "faulty":
        return {
          icon: AlertTriangle,
          text: "Faulty (85°C/CRC)",
          color: "text-rose-400 bg-rose-950/60 border-rose-800/60",
        };
      case "disconnected":
      default:
        return {
          icon: XCircle,
          text: "Disconnected",
          color: "text-slate-400 bg-slate-800/80 border-slate-700",
        };
    }
  };

  const probeList = [
    {
      id: "tray1",
      name: "Tray 1 Sensor (DS18B20 #1)",
      location: "Upper Drying Deck (Inlet)",
      status: isStale ? ("stale" as SensorStatus) : sensors.tray1,
      icon: Layers,
    },
    {
      id: "tray2",
      name: "Tray 2 Sensor (DS18B20 #2)",
      location: "Lower Drying Deck (Exhaust)",
      status: isStale ? ("stale" as SensorStatus) : sensors.tray2,
      icon: Layers,
    },
    {
      id: "pcm",
      name: "PCM Thermal Core (DS18B20 #3)",
      location: "Phase Change Storage Bed",
      status: isStale ? ("stale" as SensorStatus) : sensors.pcm,
      icon: Flame,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-sm text-slate-200">Sensor & Hardware Health Diagnostics</h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          1-Wire Bus: <strong className="text-emerald-400">GPIO 16</strong>
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
              className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-slate-800/80 text-slate-300">
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-slate-200">{probe.name}</h4>
                  <p className="text-[10px] text-slate-500">{probe.location}</p>
                </div>
              </div>

              <div className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center space-x-1 ${badge.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{badge.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auxiliary Hardware Subsystems */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
          <div className="flex items-center space-x-2 text-slate-300">
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
            <span>Solar Battery System (GPIO 35):</span>
          </div>
          <span className="font-mono font-medium text-emerald-400">
            {batteryVoltage !== undefined && batteryVoltage !== null ? `${batteryVoltage.toFixed(2)} V (Normal)` : "Divider Not Detected"}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
          <div className="flex items-center space-x-2 text-slate-300">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Dual Buzzers (GPIO 25/26):</span>
          </div>
          <span className="font-mono font-medium text-emerald-400">
            Armed & Standalone Resilient
          </span>
        </div>
      </div>
    </div>
  );
}
