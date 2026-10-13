"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  Settings as SettingsIcon,
  Save,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  Radio,
  Battery,
  Droplets,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { SystemThresholds, FeatureFlags, PcmCalibrationConfig } from "@/types/telemetry";

export default function SystemSettingsPage() {
  const {
    thresholds,
    pcmConfig,
    featureFlags,
    updateSettings,
    isAdmin,
    deviceApiKey,
  } = useTelemetry();

  // Local state for all editable thresholds
  const [localThresholds, setLocalThresholds] = useState<SystemThresholds>(thresholds);
  const [localPcm, setLocalPcm] = useState<PcmCalibrationConfig>(pcmConfig);
  const [localFlags, setLocalFlags] = useState<FeatureFlags>(featureFlags);

  // Key reveal and copy state
  const [revealKey, setRevealKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedConfigUrl, setCopiedConfigUrl] = useState(false);

  // Status messages
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Origin for real endpoint URLs
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(
        process.env.NEXT_PUBLIC_APP_URL ||
          window.location.origin ||
          "https://pcm-six.vercel.app"
      );
    }
  }, []);

  useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds]);

  useEffect(() => {
    setLocalPcm(pcmConfig);
  }, [pcmConfig]);

  useEffect(() => {
    setLocalFlags(featureFlags);
  }, [featureFlags]);

  const telemetryEndpoint = `${origin || "https://pcm-six.vercel.app"}/api/telemetry`;
  const configEndpoint = `${origin || "https://pcm-six.vercel.app"}/api/device-config`;

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setSaveError("Administrator authentication required to update system thresholds.");
      return;
    }

    setSaveError(null);
    try {
      await updateSettings({
        thresholds: localThresholds,
        pcmConfig: localPcm,
        featureFlags: localFlags,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch {
      setSaveError("Failed to save settings. Please verify server connectivity.");
    }
  };

  return (
    <>
      <title>System Settings & Device Configuration | Solar Dryer IoT</title>
      <meta
        name="description"
        content="Configure ESP32 alarm thresholds, PCM thermal transition points, feature flags, and secure device API credentials."
      />

      <div className="space-y-6">
        {/* Title Header */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                System Thresholds & Device Settings
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure thermal alarm trip-points, PCM transition limits, hardware feature flags, and authenticated ingestion endpoints.
            </p>
          </div>

          <div>
            {isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Unlock className="w-4 h-4 text-emerald-600" />
                <span>Admin Session Active (Unlocked)</span>
              </span>
            ) : (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Login to Edit Settings</span>
              </Link>
            )}
          </div>
        </div>

        {/* Read-Only Notice for Visitors */}
        {!isAdmin && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-200">Public Read-Only Mode: </span>
              All threshold limits and peripheral flags are displayed in read-only mode. To modify thresholds or reveal the device API secret, log in via the{" "}
              <Link href="/admin" className="text-emerald-600 dark:text-emerald-400 font-medium underline underline-offset-2">
                Admin Authentication portal
              </Link>.
            </div>
          </div>
        )}

        {/* Save Feedback Alerts */}
        {saveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Settings saved successfully and synchronized with Supabase!</span>
          </div>
        )}
        {saveError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSaveAll} className="space-y-6">
          {/* Section 1: Temperature Thresholds */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-2">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Temperature Alarm Trip-Points & Controller Limits
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              These limits govern both dashboard alert banners and autonomous local buzzers on the ESP32.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Tray 1 Warning */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tray 1 Warning (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!isAdmin}
                  value={localThresholds.tray1Warn}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, tray1Warn: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Default: 58.0°C. Buzzer 1 (GPIO 25) pulsates.
                </span>
              </div>

              {/* Tray 1 Critical */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tray 1 Critical (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!isAdmin}
                  value={localThresholds.tray1Crit}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, tray1Crit: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Default: 68.0°C. Buzzer 2 (GPIO 26) continuous tone.
                </span>
              </div>

              {/* Tray 2 Warning */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tray 2 Warning (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!isAdmin}
                  value={localThresholds.tray2Warn}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, tray2Warn: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Default: 58.0°C.
                </span>
              </div>

              {/* Tray 2 Critical */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Tray 2 Critical (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!isAdmin}
                  value={localThresholds.tray2Crit}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, tray2Crit: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Default: 68.0°C.
                </span>
              </div>

              {/* PCM Warning */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  PCM Warning (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!isAdmin}
                  value={localThresholds.pcmWarn}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, pcmWarn: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Default: 60.0°C. Warns on thermal saturation.
                </span>
              </div>

              {/* PCM Critical */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  PCM Critical (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!isAdmin}
                  value={localThresholds.pcmCrit}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, pcmCrit: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Default: 72.0°C. Danger of paraffin degradation.
                </span>
              </div>

              {/* Telemetry Send Interval */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Telemetry Send Interval (Seconds)
                </label>
                <input
                  type="number"
                  step="5"
                  min="10"
                  max="3600"
                  disabled={!isAdmin}
                  value={localThresholds.sendIntervalSec}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, sendIntervalSec: parseInt(e.target.value) || 60 })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Default: 60s. Offline timeout triggers at 2× interval ({localThresholds.sendIntervalSec * 2}s).
                </span>
              </div>

              {/* Battery Divider Ratio */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Battery Divider Ratio
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!isAdmin}
                  value={localThresholds.batteryDividerRatio}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, batteryDividerRatio: parseFloat(e.target.value) || 5.545 })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  R1=100k, R2=22k formula: (100+22)/22 = 5.545.
                </span>
              </div>

              {/* Battery Calibration Offset */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Battery Voltage Offset (V)
                </label>
                <input
                  type="number"
                  step="0.05"
                  disabled={!isAdmin}
                  value={localThresholds.batteryCalibrationOffset}
                  onChange={(e) =>
                    setLocalThresholds({ ...localThresholds, batteryCalibrationOffset: parseFloat(e.target.value) || 0.0 })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Trims diode drop or ADC non-linearity.
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: PCM Operational Mode & Latent Heat Settings */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
              PCM State Transition & Thermal Parameters
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Defines latent plateau, charging onset, and nighttime discharge thresholds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  PCM Charge Trigger (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!isAdmin}
                  value={localThresholds.pcmChargeTrigger}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setLocalThresholds({ ...localThresholds, pcmChargeTrigger: val });
                    setLocalPcm({ ...localPcm, chargeStartTempC: val });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Mode becomes &apos;PCM Charging&apos; when PCM ≥ this limit.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  PCM Phase Change Plateau (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!isAdmin}
                  value={localThresholds.pcmPlateau}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setLocalThresholds({ ...localThresholds, pcmPlateau: val });
                    setLocalPcm({ ...localPcm, phaseChangeTempC: val });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Nominal melting temperature of chosen paraffin.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Discharge Delta Margin (Δ°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!isAdmin}
                  value={localThresholds.dischargeDelta}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setLocalThresholds({ ...localThresholds, dischargeDelta: val });
                    setLocalPcm({ ...localPcm, dischargeThresholdDeltaC: val });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Heat release mode triggers when PCM &gt; (Tray Mean + Δ).
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Optional Peripheral Feature Flags (Item 12) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
              Optional Hardware Module Feature Flags
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Toggle modules based on physically mounted hardware. When disabled, peripheral cards and telemetry rows remain hidden.
            </p>

            <div className="space-y-3">
              {/* Solar Battery Voltage Divider */}
              <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={localFlags.batteryMonitorEnabled}
                  onChange={(e) =>
                    setLocalFlags({ ...localFlags, batteryMonitorEnabled: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-60"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Battery className="w-4 h-4 text-emerald-600" />
                    <span>Solar Battery Voltage Divider (GPIO 35 ADC)</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Off by default. Enable only after installing the 12V lead-acid / LiFePO4 battery and 100k/22k divider.
                  </p>
                </div>
              </label>

              {/* SIM800L GSM */}
              <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={localFlags.gsmEnabled}
                  onChange={(e) =>
                    setLocalFlags({ ...localFlags, gsmEnabled: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-60"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-slate-500" />
                    <span>SIM800L GSM/SMS Alert Module (UART2)</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Off by default. Enables emergency SMS transmission on critical overheat.
                  </p>
                </div>
              </label>

              {/* Chamber Moisture Sensor */}
              <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={localFlags.moistureEnabled}
                  onChange={(e) =>
                    setLocalFlags({ ...localFlags, moistureEnabled: e.target.checked })
                  }
                  className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-60"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    <span>Drying Chamber Moisture Sensor (GPIO 34)</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Off by default. <em>Caveat: Soil moisture sensor is not a direct food-moisture measurement unless calibrated.</em>
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Save Button (Admin Only) */}
          {isAdmin && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save All System Thresholds & Configuration</span>
              </button>
            </div>
          )}
        </form>

        {/* Section 4: ESP32 Hardware Ingestion Credentials (Item 4 & 7) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div>
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
              ESP32 Ingestion Credentials & API Endpoints
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure these exact endpoint URLs and authentication headers in <code className="text-emerald-700 dark:text-emerald-400 font-mono">firmware/esp32_solar_dryer/config.h</code> before flashing.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Real Telemetry Ingest URL (Item 7) */}
            <div>
              <span className="text-slate-600 dark:text-slate-400 block mb-1 font-sans">
                Telemetry Ingestion Endpoint (POST):
              </span>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium truncate mr-2">
                  {telemetryEndpoint}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(telemetryEndpoint, setCopiedUrl)}
                  className="p-1.5 rounded bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0"
                  title="Copy Ingest URL"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remote Config Endpoint (Item 14) */}
            <div>
              <span className="text-slate-600 dark:text-slate-400 block mb-1 font-sans">
                Remote Device Config Endpoint (GET):
              </span>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-emerald-800 dark:text-emerald-300 font-medium truncate mr-2">
                  {configEndpoint}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(configEndpoint, setCopiedConfigUrl)}
                  className="p-1.5 rounded bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0"
                  title="Copy Config URL"
                >
                  {copiedConfigUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Ingestion API Key (Item 4: Masked, Reveal/Hide, Copy, Admin Only) */}
            <div>
              <span className="text-slate-600 dark:text-slate-400 block mb-1 font-sans">
                Device Secret Key Header (<code className="text-slate-900 dark:text-slate-200">x-api-key</code>):
              </span>
              {isAdmin ? (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-slate-900 dark:text-slate-100 font-bold truncate mr-2">
                    {deviceApiKey ? (revealKey ? deviceApiKey : "••••••••••••••••••••••••••••••••") : "(No DEVICE_API_KEY set in server environment)"}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRevealKey(!revealKey)}
                      className="p-1.5 rounded bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                      title={revealKey ? "Mask API Key" : "Reveal API Key"}
                    >
                      {revealKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {deviceApiKey && (
                      <button
                        type="button"
                        onClick={() => handleCopy(deviceApiKey, setCopiedKey)}
                        className="p-1.5 rounded bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                        title="Copy API Key"
                      >
                        {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-sans text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Device API secret key hidden for security.</span>
                  </div>
                  <Link
                    href="/admin"
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold underline underline-offset-2"
                  >
                    Admin Login to Reveal
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
