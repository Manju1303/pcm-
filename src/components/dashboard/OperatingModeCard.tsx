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
          badgeColor: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200",
          cardBorder: "border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-white dark:from-amber-950/20 dark:to-slate-900",
          subtitle: "Solar heating active across trays",
        };
      case "PCM Charging":
        return {
          icon: Flame,
          title: "PCM Charging",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200",
          cardBorder: "border-emerald-200/80 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white dark:from-emerald-950/20 dark:to-slate-900",
          subtitle: "Storing latent thermal energy",
        };
      case "Nighttime Heat Release":
        return {
          icon: Moon,
          title: "Heat Release",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200",
          cardBorder: "border-indigo-200/80 bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-white dark:from-indigo-950/20 dark:to-slate-900",
          subtitle: "Discharging heat to drying chamber",
        };
      case "Idle":
        return {
          icon: PowerOff,
          title: "System Idle",
          badgeColor: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300",
          cardBorder: "border-slate-200 bg-white dark:bg-slate-900",
          subtitle: "Near-ambient temperature baseline",
        };
      case "Unknown/Not Configured":
      default:
        return {
          icon: HelpCircle,
          title: "System Standby",
          badgeColor: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
          cardBorder: "border-slate-200 bg-white dark:bg-slate-900",
          subtitle: "Awaiting telemetry stream from ESP32",
        };
    }
  };

  const details = getModeDetails();
  const ModeIcon = details.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${details.cardBorder} shadow-xs transition-all duration-300`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <ModeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {details.title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {details.subtitle}
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 text-xs font-semibold rounded-full border shadow-2xs ${details.badgeColor}`}>
          Active Mode
        </span>
      </div>
    </div>
  );
}
