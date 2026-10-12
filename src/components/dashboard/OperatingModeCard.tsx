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
          badgeColor: "bg-amber-50 text-amber-800 border-amber-300 font-semibold",
          cardBorder: "border-amber-200 bg-amber-50/30",
          description: "Solar collector heating is active. Heated air flows across produce Trays 1 and 2 to dehydrate crops.",
          physicsNote: `Collector output (${trayAvg?.toFixed(1) ?? "--"}°C) > PCM (${pcmTemp?.toFixed(1) ?? "--"}°C).`,
        };
      case "PCM Charging":
        return {
          icon: Flame,
          title: "PCM Charging (Latent Heat Absorption)",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold",
          cardBorder: "border-emerald-200 bg-emerald-50/30",
          description: "Phase Change Material is absorbing sensible heat and melting at the ~50°C plateau, locking in latent thermal storage.",
          physicsNote: `PCM reached charging threshold (≥ ${pcmConfig.chargeStartTempC}°C) under solar irradiance.`,
        };
      case "Nighttime Heat Release":
        return {
          icon: Moon,
          title: "Nighttime Heat Release (Discharging)",
          badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold",
          cardBorder: "border-indigo-200 bg-indigo-50/30",
          description: "Solar heating has ended. The solidifying PCM is releasing stored latent heat back into trays to sustain drying for up to ~5 hours.",
          physicsNote: `PCM temperature (${pcmTemp?.toFixed(1) ?? "--"}°C) > Trays (${trayAvg?.toFixed(1) ?? "--"}°C).`,
        };
      case "Idle":
        return {
          icon: PowerOff,
          title: "System Idle / Standby",
          badgeColor: "bg-slate-100 text-slate-700 border-slate-300 font-medium",
          cardBorder: "border-slate-200 bg-white",
          description: "Low solar irradiance and ambient temperatures. Thermal storage dormant.",
          physicsNote: "Sensors near ambient baseline (< 35°C).",
        };
      case "Unknown/Not Configured":
      default:
        return {
          icon: HelpCircle,
          title: "Standby / Awaiting Ingestion",
          badgeColor: "bg-slate-100 text-slate-600 border-slate-200 font-medium",
          cardBorder: "border-slate-200 bg-white",
          description: "System is in standby awaiting live telemetry frames from the ESP32 microcontroller.",
          physicsNote: "Connect ESP32 to Wi-Fi to begin telemetry streaming.",
        };
    }
  };

  const details = getModeDetails();
  const ModeIcon = details.icon;

  return (
    <div className={`rounded-xl border p-5 ${details.cardBorder} shadow-xs transition-all duration-300`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <ModeIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold font-mono">Operating Status</span>
              <span className={`px-2.5 py-0.5 text-xs rounded-full border ${details.badgeColor}`}>
                {details.title}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              {details.description}
            </p>
          </div>
        </div>

        {/* Status Physics Diagnostic */}
        <div className="sm:text-right text-xs bg-white p-2.5 rounded-lg border border-slate-200 sm:max-w-xs shadow-2xs">
          <div className="text-[11px] text-slate-500 font-mono flex items-center sm:justify-end space-x-1">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Rule Evaluation:</span>
          </div>
          <p className="text-slate-700 mt-0.5 font-mono text-[11px]">
            {details.physicsNote}
          </p>
        </div>
      </div>
    </div>
  );
}
