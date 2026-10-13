"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatExactDateTime, formatTemp } from "@/lib/utils";
import {
  Cpu,
  Battery,
  Radio,
  Zap,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Save,
  Lock,
  Droplets,
  Info,
} from "lucide-react";
import { SENSOR_NAMES } from "@/types/telemetry";

export default function SensorHealthPage() {
  const {
    currentReading,
    isOnline,
    isStale,
    isOffline,
    deviceMetadata,
    featureFlags,
    sensorMapping,
    updateSettings,
    faultHistory,
    detectedAddresses,
    isAdmin,
  } = useTelemetry();

  // Local state for ROM address assignment form
  const [tray1Rom, setTray1Rom] = useState(sensorMapping.tray1Rom || "");
  const [tray2Rom, setTray2Rom] = useState(sensorMapping.tray2Rom || "");
  const [pcmRom, setPcmRom] = useState(sensorMapping.pcmRom || "");
  const [assignmentSaved, setAssignmentSaved] = useState(false);
  const [savingError, setSavingError] = useState<string | null>(null);

  // Sync state if context updates
  React.useEffect(() => {
    setTray1Rom(sensorMapping.tray1Rom || "");
    setTray2Rom(sensorMapping.tray2Rom || "");
    setPcmRom(sensorMapping.pcmRom || "");
  }, [sensorMapping]);

  // Battery calculations
  const batteryV = currentReading?.batteryVoltage ?? null;
  const batteryPct =
    batteryV !== null
      ? Math.min(100, Math.max(0, Math.round(((batteryV - 11.6) / (12.8 - 11.6)) * 100)))
      : null;

  // Validation checks for ROM assignments
  const assignedList = [tray1Rom.trim(), tray2Rom.trim(), pcmRom.trim()].filter(Boolean);
  const hasDuplicates = new Set(assignedList).size !== assignedList.length;
  const missingAssignments = !tray1Rom.trim() || !tray2Rom.trim() || !pcmRom.trim();

  const handleSaveAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingError(null);
    setAssignmentSaved(false);

    if (hasDuplicates) {
      setSavingError("Duplicate ROM addresses detected. Each probe must have a unique 64-bit 1-Wire ROM.");
      return;
    }

    try {
      await updateSettings({
        sensorMapping: {
          tray1Rom: tray1Rom.trim(),
          tray2Rom: tray2Rom.trim(),
          pcmRom: pcmRom.trim(),
        },
      });
      setAssignmentSaved(true);
      setTimeout(() => setAssignmentSaved(false), 4000);
    } catch {
      setSavingError("Failed to persist sensor assignments. Ensure you are authenticated as admin.");
    }
  };

  // Buzzer telemetry check
  const bzState = deviceMetadata.buzzerState;
  const buzzerKnown = bzState?.buzzer1_ok !== null && bzState?.buzzer1_ok !== undefined;

  return (
    <>
      <title>Sensor Health | Agni Sakthi</title>
      <meta
        name="description"
        content="Agni Sakthi DS18B20 1-Wire probe diagnostics, ROM address assignment, and hardware fail-safe status."
      />

      <div className="space-y-6">
        {/* Title Header */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Sensor Health
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isOnline && !isStale
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOnline && !isStale ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                {isOnline && !isStale ? "Active" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Hardware Subsystems Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* ESP32 Controller Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">ESP32-WROOM-32</span>
              <span className={`w-2 h-2 rounded-full ${isOnline && !isStale ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"}`} />
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
              {isOnline && !isStale ? "Connected (Wi-Fi)" : "Disconnected"}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 space-y-0.5 font-mono">
              <div>Firmware: {deviceMetadata.firmwareVersion}</div>
              <div>Device ID: {deviceMetadata.id}</div>
              <div>Heartbeat: {bzState?.heartbeat ? "Pulsing" : "None"}</div>
            </div>
          </div>

          {/* Local Buzzer Fail-Safe Card - Item 1 Requirement: "Buzzers: unknown" until reported */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Local Buzzers (GPIO 25/26)</span>
              <Volume2 className="w-4 h-4 text-amber-500" />
            </div>
            {buzzerKnown ? (
              <>
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  Reported Online
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 space-y-0.5">
                  <div>Buzzer 1 (Warn): {bzState.buzzer1_ok ? "Arm Active" : "Fault"}</div>
                  <div>Buzzer 2 (Crit): {bzState.buzzer2_ok ? "Arm Active" : "Fault"}</div>
                  <div className="text-[10px] text-slate-400">Local fail-safe active</div>
                </div>
              </>
            ) : (
              <>
                <div className="text-base font-bold text-slate-500 dark:text-slate-400 font-mono">
                  Buzzers: unknown
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 space-y-0.5">
                  <div>Hardware Armed: Unconfirmed</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">
                    Awaiting buzzer state in telemetry frame
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Solar Battery Voltage Card - Item 1 & 12 */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Solar Battery (GPIO 35)</span>
              <Battery className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            {featureFlags.batteryMonitorEnabled ? (
              <>
                <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                  {batteryV !== null ? `${batteryV.toFixed(2)} V` : "--.- V"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 space-y-0.5">
                  <div>Est. Reserve: <strong>{batteryPct !== null ? `${batteryPct}%` : "Awaiting ADC"}</strong></div>
                  <div className="text-[10px] text-slate-400">100k/22k divider calibrated</div>
                </div>
              </>
            ) : (
              <>
                <div className="text-base font-semibold text-slate-400 dark:text-slate-500">
                  Optional / not installed
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 space-y-0.5">
                  <div>ADC Input: Disabled</div>
                  <div className="text-[10px] text-slate-400">Battery & divider not purchased</div>
                </div>
              </>
            )}
          </div>

          {/* SIM800L GSM Status Card - Item 1 & 12 */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SIM800L GSM (UART2)</span>
              <Radio className="w-4 h-4 text-slate-400" />
            </div>
            {featureFlags.gsmEnabled ? (
              <>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100 font-mono">
                  Enabled
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 space-y-0.5">
                  <div>SMS alerts: Active</div>
                  <div className="text-[10px] text-slate-400">Requires valid micro-SIM</div>
                </div>
              </>
            ) : (
              <>
                <div className="text-base font-semibold text-slate-400 dark:text-slate-500">
                  Optional / not installed
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 space-y-0.5">
                  <div>Hardware: Standby</div>
                  <div className="text-[10px] text-slate-400">SMS alert triggers muted</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Optional Moisture Sensor Notice if enabled */}
        {featureFlags.moistureEnabled && (
          <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50 dark:bg-sky-950/30 p-4 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-3">
            <Droplets className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Moisture Sensor (GPIO 34) Active: </span>
              Soil moisture sensor is not a direct food-moisture measurement unless calibrated.
            </div>
          </div>
        )}

        {/* 1-Wire Bus & Physical Probe Overview */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                1-Wire Multi-Drop Bus Topology (GPIO 16)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All three digital probes share a single physical GPIO with a 4.7 kΩ pull-up resistor to 3.3V.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
              <Zap className="w-4 h-4 text-sky-500" />
              <span>Pull-up: 4.7 kΩ | CRC8 Checksum</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Standard Probe Role</th>
                  <th className="py-2.5 px-3">Mounting Location</th>
                  <th className="py-2.5 px-3">Assigned 64-bit ROM</th>
                  <th className="py-2.5 px-3">Live Reading</th>
                  <th className="py-2.5 px-3 text-right">Integrity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-sky-700 dark:text-sky-400">
                    {SENSOR_NAMES.tray1}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                    Upper drying tray / Collector hot air inlet
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {sensorMapping.tray1Rom || <span className="text-amber-500 italic">Unassigned</span>}
                  </td>
                  <td className="py-2.5 px-3 font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatTemp(currentReading?.temperatures.tray1)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        currentReading?.sensors.tray1 === "ok"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : currentReading?.sensors.tray1 === "fault"
                          ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {currentReading?.sensors.tray1 || (isOnline ? "Active" : "Standby")}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-indigo-700 dark:text-indigo-400">
                    {SENSOR_NAMES.tray2}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                    Lower drying tray / Air exhaust zone
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {sensorMapping.tray2Rom || <span className="text-amber-500 italic">Unassigned</span>}
                  </td>
                  <td className="py-2.5 px-3 font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatTemp(currentReading?.temperatures.tray2)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        currentReading?.sensors.tray2 === "ok"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : currentReading?.sensors.tray2 === "fault"
                          ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {currentReading?.sensors.tray2 || (isOnline ? "Active" : "Standby")}
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold text-emerald-700 dark:text-emerald-400">
                    {SENSOR_NAMES.pcm}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400">
                    Encapsulated inside paraffin thermal storage core
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {sensorMapping.pcmRom || <span className="text-amber-500 italic">Unassigned</span>}
                  </td>
                  <td className="py-2.5 px-3 font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatTemp(currentReading?.temperatures.pcm)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        currentReading?.sensors.pcm === "ok"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : currentReading?.sensors.pcm === "fault"
                          ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {currentReading?.sensors.pcm || (isOnline ? "Active" : "Standby")}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Item 13: Sensor ROM Address Assignment Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                1-Wire Bus ROM Address Role Assignment
              </h2>
            </div>
            {!isAdmin && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                <Lock className="w-3.5 h-3.5" /> Read-Only (Admin Login Required)
              </span>
            )}
          </div>

          <div className="p-3.5 mb-4 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-300">
            <strong>Practical Probe Identification Hint:</strong> Warm one probe in your hand and see which reading rises on the Live view, then record its 64-bit ROM address here.
          </div>

          {/* Validation Warnings */}
          {hasDuplicates && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Warning: Duplicate ROM addresses detected! Two or more probes share the same address.</span>
            </div>
          )}
          {missingAssignments && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Notice: One or more sensor roles are missing assigned ROM addresses.</span>
            </div>
          )}

          {/* Detected addresses chip list */}
          {detectedAddresses.length > 0 && (
            <div className="mb-4 text-xs">
              <span className="text-slate-500 dark:text-slate-400 mr-2">Discovered ROM Addresses on Bus:</span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {detectedAddresses.map((addr) => (
                  <span
                    key={addr}
                    className="font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px]"
                  >
                    {addr}
                  </span>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSaveAssignments} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tray 1 ROM */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {SENSOR_NAMES.tray1}
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={tray1Rom}
                  onChange={(e) => setTray1Rom(e.target.value)}
                  placeholder="e.g. 28FF641E831704AD"
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tray 2 ROM */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {SENSOR_NAMES.tray2}
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={tray2Rom}
                  onChange={(e) => setTray2Rom(e.target.value)}
                  placeholder="e.g. 28FF641E831704AE"
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* PCM ROM */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {SENSOR_NAMES.pcm}
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={pcmRom}
                  onChange={(e) => setPcmRom(e.target.value)}
                  placeholder="e.g. 28FF641E831704AF"
                  className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" /> Save ROM Role Mapping
                </button>
                {assignmentSaved && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Assignments saved to Supabase
                  </span>
                )}
                {savingError && (
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> {savingError}
                  </span>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Item 10: Sensor Faults Log & Diagnostic History */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center space-x-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Sensor Fault Log & Integrity Monitor
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Automated detection for 1-Wire probe disconnects (-127°C), power-on reset defaults (85.0°C), flat-lined traces, out-of-range excursions, and missing ROM identifiers.
          </p>

          {faultHistory && faultHistory.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Probe</th>
                    <th className="py-2.5 px-3">Fault Classification</th>
                    <th className="py-2.5 px-3">Raw Value</th>
                    <th className="py-2.5 px-3">Diagnostic Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {faultHistory.map((fault) => (
                    <tr key={fault.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                        {formatExactDateTime(fault.timestamp)}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100 uppercase">
                        {fault.sensor}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          {fault.faultType}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-bold tabular-nums">
                        {fault.rawValue !== null && fault.rawValue !== undefined ? `${fault.rawValue.toFixed(1)}°C` : "--"}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-400">
                        {fault.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No Active Sensor Faults
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                All configured probes are operating without 1-Wire communication dropouts, flatlines, or power reset conditions.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
