"use client";

import React, { useState } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  Settings as SettingsIcon,
  Save,
  Radio,
  Key,
  Flame,
  Clock,
  Layers,
  Cpu,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

export default function SystemSettingsPage() {
  const {
    isDemoMode,
    setDemoMode,
    pcmConfig,
    updatePcmConfig,
    deviceMetadata,
  } = useTelemetry();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Editable parameters
  const [chargeStart, setChargeStart] = useState(pcmConfig.chargeStartTempC);
  const [phaseChangeTemp, setPhaseChangeTemp] = useState(pcmConfig.phaseChangeTempC);
  const [dischargeDelta, setDischargeDelta] = useState(pcmConfig.dischargeThresholdDeltaC);

  const apiKeyExample = "sd_secret_key_college_dryer_2026";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePcmConfig({
      ...pcmConfig,
      chargeStartTempC: chargeStart,
      phaseChangeTempC: phaseChangeTemp,
      dischargeThresholdDeltaC: dischargeDelta,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKeyExample);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">
            System Settings & Operating Mode Rules
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Configure rule thresholds for state determination, device identifiers, and telemetry credentials.
        </p>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>System operational settings updated and applied successfully!</span>
        </div>
      )}

      {/* Simulation / Data Source Mode */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="font-semibold text-sm text-slate-200 mb-1">
          Telemetry Data Source Mode
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Select between simulated thermodynamic demo data and live physical ESP32 hardware telemetry.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setDemoMode(true)}
            className={`p-4 rounded-xl border text-left transition-all flex-1 ${
              isDemoMode
                ? "bg-amber-950/30 border-amber-500/60 text-amber-200"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase tracking-wide">Simulated Demo Mode</span>
              {isDemoMode && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
            </div>
            <p className="text-[11px] text-slate-400">
              Generates continuous thermodynamic solar cycles and PCM heat release curves for demonstration without hardware.
            </p>
          </button>

          <button
            onClick={() => setDemoMode(false)}
            className={`p-4 rounded-xl border text-left transition-all flex-1 ${
              !isDemoMode
                ? "bg-emerald-950/30 border-emerald-500/60 text-emerald-200"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase tracking-wide">Real Hardware Mode</span>
              {!isDemoMode && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
            </div>
            <p className="text-[11px] text-slate-400">
              Awaits authenticated HTTP POST telemetry from physical ESP32 controller. Displays stale/offline if device drops.
            </p>
          </button>
        </div>
      </div>

      {/* Operating Mode Decision Rules Editor */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="font-semibold text-sm text-slate-200 mb-1">
          Operating Mode Rule Thresholds
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          The system determines operational phase (Daytime Drying, PCM Charging, Nighttime Heat Release, Idle) using these configured criteria.
        </p>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                PCM Charge Trigger Temp (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={chargeStart}
                onChange={(e) => setChargeStart(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Rule: Mode becomes &apos;PCM Charging&apos; when PCM ≥ this threshold in daylight.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                PCM Phase Change Plateau (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={phaseChangeTemp}
                onChange={(e) => setPhaseChangeTemp(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Melting temperature of paraffin (e.g. RT-50 melts ~50.0°C).
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Discharge Delta Margin (Δ°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={dischargeDelta}
                onChange={(e) => setDischargeDelta(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Rule: Mode becomes &apos;Nighttime Heat Release&apos; when PCM &gt; (Tray Mean + Δ).
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rules Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Firmware Ingestion API Key & Connection Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="font-semibold text-sm text-slate-200 mb-1">
          ESP32 Ingestion Credentials & Endpoint
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Copy these credentials into <code className="text-emerald-400 font-mono">firmware/esp32_solar_dryer/config.h</code> before flashing your board.
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <span className="text-slate-400 block mb-1">API Server URL:</span>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400">
              http://[YOUR_SERVER_IP]:3000/api/telemetry
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Authentication Header: x-api-key</span>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 flex items-center justify-between">
              <span>{apiKeyExample}</span>
              <button
                onClick={handleCopyKey}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Copy API Key"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
