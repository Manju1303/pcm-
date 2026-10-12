"use client";

import React, { useState } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";

export default function SystemSettingsPage() {
  const {
    pcmConfig,
    updatePcmConfig,
  } = useTelemetry();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

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
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5">
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            System Settings & Operating Mode Rules
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Configure rule thresholds for state determination, device identifiers, and telemetry credentials.
        </p>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>System operational settings updated and applied successfully!</span>
        </div>
      )}

      {/* Operating Mode Decision Rules Editor */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-semibold text-sm text-slate-900 mb-1">
          Operating Mode Rule Thresholds
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          The system determines operational phase (Daytime Drying, PCM Charging, Nighttime Heat Release, Idle) using these criteria.
        </p>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                PCM Charge Trigger Temp (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={chargeStart}
                onChange={(e) => setChargeStart(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Rule: Mode becomes &apos;PCM Charging&apos; when PCM ≥ this threshold in daylight.
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                PCM Phase Change Plateau (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={phaseChangeTemp}
                onChange={(e) => setPhaseChangeTemp(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Melting temperature of paraffin (e.g. RT-50 melts ~50.0°C).
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Discharge Delta Margin (Δ°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={dischargeDelta}
                onChange={(e) => setDischargeDelta(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Rule: Mode becomes &apos;Nighttime Heat Release&apos; when PCM &gt; (Tray Mean + Δ).
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rules Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Firmware Ingestion API Key & Connection Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-semibold text-sm text-slate-900 mb-1">
          ESP32 Ingestion Credentials & Endpoint
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Copy these credentials into <code className="text-emerald-700 font-mono">firmware/esp32_solar_dryer/config.h</code> before flashing your board.
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <span className="text-slate-600 block mb-1">API Server URL:</span>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-emerald-800 font-medium">
              https://[YOUR_VERCEL_DOMAIN]/api/telemetry
            </div>
          </div>

          <div>
            <span className="text-slate-600 block mb-1">Authentication Header: x-api-key</span>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-between">
              <span>{apiKeyExample}</span>
              <button
                onClick={handleCopyKey}
                className="p-1.5 rounded bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                title="Copy API Key"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
