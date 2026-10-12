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
          text: "Healthy & Active",
          color: "text-emerald-800 bg-emerald-50 border-emerald-200",
        };
      case "stale":
        return {
          icon: Clock,
          text: "Stale (Delayed)",
          color: "text-amber-800 bg-amber-50 border-amber-200",
        };
      case "faulty":
        return {
          icon: AlertTriangle,
          text: "Faulty (85°C Reset)",
          color: "text-rose-800 bg-rose-50 border-rose-200",
        };
      case "disconnected":
      default:
        return {
          icon: XCircle,
          text: "Standby / Not Detected",
          color: "text-slate-600 bg-slate-100 border-slate-200",
        };
    }
  };

  const probeList = [
    {
      id: "tray1",
      name: "Tray 1 Sensor (DS18B20 #1)",
      location: "Upper Drying Deck (Inlet)",
      status: !isOnline ? ("disconnected" as SensorStatus) : isStale ? ("stale" as SensorStatus) : sensors.tray1,
      icon: Layers,
    },
    {
      id: "tray2",
      name: "Tray 2 Sensor (DS18B20 #2)",
      location: "Lower Drying Deck (Exhaust)",
      status: !isOnline ? ("disconnected" as SensorStatus) : isStale ? ("stale" as SensorStatus) : sensors.tray2,
      icon: Layers,
    },
    {
      id: "pcm",
      name: "PCM Thermal Core (DS18B20 #3)",
      location: "Phase Change Storage Bed",
      status: !isOnline ? ("disconnected" as SensorStatus) : isStale ? ("stale" as SensorStatus) : sensors.pcm,
      icon: Flame,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-sm text-slate-900">Sensor & Hardware Health Diagnostics</h3>
        </div>
        <span className="text-xs font-mono text-slate-500">
          1-Wire Bus: <strong className="text-emerald-700">GPIO 16</strong>
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
              className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-white text-slate-600 border border-slate-200 shadow-2xs">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">{probe.name}</h4>
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
      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center space-x-2 text-slate-700">
            <BatteryCharging className="w-4 h-4 text-emerald-600" />
            <span>Solar Battery Divider (GPIO 35):</span>
          </div>
          <span className="font-mono font-semibold text-emerald-700">
            {batteryVoltage !== undefined && batteryVoltage !== null ? `${batteryVoltage.toFixed(2)} V` : "Awaiting ADC telemetry"}
          </span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center space-x-2 text-slate-700">
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Dual Buzzers (GPIO 25/26):</span>
          </div>
          <span className="font-mono font-semibold text-emerald-700">
            Hardware Armed (Local Fail-safe)
          </span>
        </div>
      </div>
    </div>
  );
}
