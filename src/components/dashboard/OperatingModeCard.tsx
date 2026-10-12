"use client";

import React from "react";
import { OperatingMode, PcmCalibrationConfig } from "@/types/telemetry";
import {
  Sun,
  Flame,
  Moon,
  PowerOff,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
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
          badgeColor: "bg-amber-950/80 text-amber-300 border-amber-800",
          cardBorder: "border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900/60 to-slate-900/80",
          description: "Direct solar collector heating is active. Airflow carries thermal energy over product Trays 1 and 2 to dehydrate produce.",
          physicsNote: `Collector output (${trayAvg?.toFixed(1) ?? "--"}°C) > PCM temperature (${pcmTemp?.toFixed(1) ?? "--"}°C).`,
        };
      case "PCM Charging":
        return {
          icon: Flame,
          title: "PCM Charging (Latent Heat Absorption)",
          badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
          cardBorder: "border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-slate-900/60 to-slate-900/80",
          description: "Phase Change Material is absorbing sensible heat and melting at the ~50°C plateau, locking in latent heat (ΔH = 190 kJ/kg).",
          physicsNote: `PCM (${pcmTemp?.toFixed(1) ?? "--"}°C) reached charge threshold (≥ ${pcmConfig.chargeStartTempC}°C) under solar irradiance.`,
        };
      case "Nighttime Heat Release":
        return {
          icon: Moon,
          title: "Nighttime Heat Release (Discharging)",
          badgeColor: "bg-indigo-950/80 text-indigo-300 border-indigo-800",
          cardBorder: "border-indigo-500/40 bg-gradient-to-br from-indigo-950/20 via-slate-900/60 to-slate-900/80",
          description: "Solar heating has ended. The solidified/crystallizing PCM is releasing stored latent heat back into Trays to sustain drying for up to ~5 hours.",
          physicsNote: `PCM temperature (${pcmTemp?.toFixed(1) ?? "--"}°C) > Trays (${trayAvg?.toFixed(1) ?? "--"}°C). Active nocturnal heat transfer.`,
        };
      case "Idle":
        return {
          icon: PowerOff,
          title: "System Idle / Standby",
          badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
          cardBorder: "border-slate-800 bg-slate-900/80",
          description: "Low solar irradiance and ambient temperatures. Thermal storage depleted or system dormant.",
          physicsNote: "Sensors near ambient baseline (< 35°C). No active drying cycle detected.",
        };
      case "Unknown/Not Configured":
      default:
        return {
          icon: HelpCircle,
          title: "Unknown / Not Configured",
          badgeColor: "bg-slate-800 text-slate-400 border-slate-700",
          cardBorder: "border-slate-800 bg-slate-900/80",
          description: "Cannot reliably determine operational mode due to disconnected, stale, or uncalibrated sensor probes.",
          physicsNote: "Verify physical sensor bus connections and calibration in Settings.",
        };
    }
  };

  const details = getModeDetails();
  const ModeIcon = details.icon;

  return (
    <div className={`rounded-xl border p-5 ${details.cardBorder} transition-all duration-300`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-inner">
            <ModeIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">Operating Status</span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${details.badgeColor}`}>
                {details.title}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {details.description}
            </p>
          </div>
        </div>

        {/* Status Physics Diagnostic */}
        <div className="sm:text-right text-xs bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 sm:max-w-xs">
          <div className="text-[11px] text-slate-400 font-mono flex items-center sm:justify-end space-x-1">
            <Info className="w-3 h-3 text-slate-500" />
            <span>Rule Evaluation:</span>
          </div>
          <p className="text-slate-300 mt-0.5 font-mono text-[11px]">
            {details.physicsNote}
          </p>
        </div>
      </div>
    </div>
  );
}
