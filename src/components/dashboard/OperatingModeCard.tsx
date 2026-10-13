"use client";

import React from "react";
import { OperatingMode, PcmCalibrationConfig } from "@/types/telemetry";
import {
  Sun,
  Flame,
  Moon,
  PowerOff,
  HelpCircle,
  Info,
} from "lucide-react";

interface OperatingModeCardProps {
  mode: OperatingMode;
  pcmConfig: PcmCalibrationConfig;
  trayAvg: number | null;
  pcmTemp: number | null;
}

export function OperatingModeCard({
  mode,
  pcmConfig,
  trayAvg,
  pcmTemp,
}: OperatingModeCardProps) {
  const getModeDetails = () => {
    switch (mode) {
      case "Daytime Drying":
        return {
          icon: Sun,
          title: "Daytime Drying",
          badgeColor: "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 font-semibold",
          cardBorder: "border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20",
          description: "Solar collector heating active. Heated air flows across Tray 1 and Tray 2 to dehydrate produce.",
          physicsNote: `Collector output (${trayAvg !== null ? `${trayAvg.toFixed(1)}°C` : "--"}) > PCM (${pcmTemp !== null ? `${pcmTemp.toFixed(1)}°C` : "--"}).`,
        };
      case "PCM Charging":
        return {
          icon: Flame,
          title: "PCM Charging (Latent Heat Absorption)",
          badgeColor: "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 font-semibold",
          cardBorder: "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20",
          description: "Phase Change Material absorbing sensible heat and melting at nominal phase plateau (~45-51°C) to store latent heat.",
          physicsNote: `PCM reached charging trigger (≥ ${pcmConfig.chargeStartTempC}°C) in daylight.`,
        };
      case "Nighttime Heat Release":
        return {
          icon: Moon,
          title: "Nighttime Heat Release (Discharging)",
          badgeColor: "bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border-indigo-300 font-semibold",
          cardBorder: "border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20",
          description: "Solar heating ended. Solidifying PCM releasing latent heat back into drying trays (Target: sustain drying up to ~5 hrs; project target - not yet validated).",
          physicsNote: `PCM temperature (${pcmTemp !== null ? `${pcmTemp.toFixed(1)}°C` : "--"}) > Trays (${trayAvg !== null ? `${trayAvg.toFixed(1)}°C` : "--"}).`,
        };
      case "Idle":
        return {
          icon: PowerOff,
          title: "System Idle / Standby",
          badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 font-medium",
          cardBorder: "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
          description: "Low solar irradiance and near-ambient chamber temperatures. Thermal storage dormant.",
          physicsNote: "Sensors near ambient baseline (< 35°C).",
        };
      case "Unknown/Not Configured":
      default:
        return {
          icon: HelpCircle,
          title: "Standby / Awaiting Ingestion",
          badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 font-medium",
          cardBorder: "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
          description: "System in standby awaiting live telemetry frames from the ESP32 microcontroller.",
          physicsNote: "Connect ESP32 to Wi-Fi to begin telemetry streaming.",
        };
    }
  };

  const details = getModeDetails();
  const ModeIcon = details.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 ${details.cardBorder} shadow-sm backdrop-blur-xs transition-all duration-300`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <ModeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold font-mono">
                Operating Status
              </span>
              <span className={`px-2.5 py-0.5 text-xs rounded-full border shadow-2xs ${details.badgeColor}`}>
                {details.title}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
              {details.description}
            </p>
          </div>
        </div>

        {/* Status Physics Diagnostic */}
        <div className="sm:text-right text-xs bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 sm:max-w-xs shadow-2xs">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center sm:justify-end space-x-1">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Rule Evaluation:</span>
          </div>
          <p className="text-slate-700 dark:text-slate-200 mt-0.5 font-mono text-[11px]">
            {details.physicsNote}
          </p>
        </div>
      </div>
    </div>
  );
}
