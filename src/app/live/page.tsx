"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatTime, formatTemp, formatTempUnit } from "@/lib/utils";
import {
  Activity,
  Wind,
  Flame,
  Layers,
  Thermometer,
  Volume2,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function LiveMonitoringPage() {
  const { currentReading, isOnline, isStale, isOffline, isAdmin, thresholds } = useTelemetry();
  const [buzzerTestTriggered, setBuzzerTestTriggered] = useState(false);
  const [buzzerError, setBuzzerError] = useState<string | null>(null);

  const t1 = currentReading?.sensors.tray1 === "ok" ? currentReading.temperatures.tray1 : null;
  const t2 = currentReading?.sensors.tray2 === "ok" ? currentReading.temperatures.tray2 : null;
  const pcm = currentReading?.sensors.pcm === "ok" ? currentReading.temperatures.pcm : null;

  const warnTray1 = thresholds?.tray1Warn ?? 82.0;
  const critTray1 = thresholds?.tray1Crit ?? 88.0;
  const warnTray2 = thresholds?.tray2Warn ?? 80.0;
  const critTray2 = thresholds?.tray2Crit ?? 86.0;
  const warnPcm = thresholds?.pcmWarn ?? 54.0;
  const critPcm = thresholds?.pcmCrit ?? 58.0;

  const GaugeMeter = ({
    title,
    subtitle,
    value,
    unit = "°C",
    min = 20,
    max = 80,
    accentColor = "#059669",
    warn = 58,
    crit = 68,
    isStaleOrOffline = false,
  }: {
    title: string;
    subtitle: string;
    value: number | null;
    unit?: string;
    min?: number;
    max?: number;
    accentColor?: string;
    warn?: number;
    crit?: number;
    isStaleOrOffline?: boolean;
  }) => {
    const val = value ?? min;
    const percentage = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
    const strokeDashoffset = 251.2 - (251.2 * percentage * 0.75) / 100;

    const isCrit = !isStaleOrOffline && value !== null && value >= crit;
    const isWarn = !isStaleOrOffline && value !== null && value >= warn && !isCrit;

    const dynamicColor = isStaleOrOffline
      ? "#94a3b8"
      : isCrit
      ? "#ef4444"
      : isWarn
      ? "#f59e0b"
      : accentColor;

    return (
      <div
        className={`p-5 rounded-xl border bg-white dark:bg-slate-900 shadow-xs flex flex-col items-center text-center relative overflow-hidden transition-all ${
          isCrit
            ? "border-rose-400 dark:border-rose-700 bg-rose-50/30 border-critical-pulse"
            : isWarn
            ? "border-amber-300 dark:border-amber-700"
            : "border-slate-200 dark:border-slate-800"
        } ${isStaleOrOffline ? "opacity-75" : ""}`}
      >
        <div className="flex items-center space-x-1.5 mb-0.5">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{title}</h4>
          {isStaleOrOffline && (
            <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase">
              Stale
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">{subtitle}</p>

        {/* SVG Circular Gauge */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-135" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset="62.8"
              strokeLinecap="round"
              className="dark:stroke-slate-800"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={dynamicColor}
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centered Tabular Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl tabular-nums font-mono font-bold text-slate-900 dark:text-slate-100">
              {value !== null && !isStaleOrOffline ? value.toFixed(1) : value !== null ? value.toFixed(1) : "--"}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{unit}</span>
          </div>
        </div>

        <div className="flex justify-between w-full text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 px-4">
          <span>{min}{unit}</span>
          <span>Warn: {warn}°</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    );
  };

  const handleTestBuzzer = async () => {
    if (!isAdmin) {
      setBuzzerError("Administrator session required to trigger buzzer test.");
      setTimeout(() => setBuzzerError(null), 3000);
      return;
    }

    try {
      const res = await fetch("/api/buzzer/test", { method: "POST" });
      if (res.ok) {
        setBuzzerTestTriggered(true);
        // Play local simulated tone
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        } catch {
          // ignore
        }
        setTimeout(() => setBuzzerTestTriggered(false), 2000);
      } else {
        setBuzzerError("Failed to trigger buzzer test on server.");
        setTimeout(() => setBuzzerError(null), 3000);
      }
    } catch {
      setBuzzerError("Network error triggering buzzer test.");
      setTimeout(() => setBuzzerError(null), 3000);
    }
  };

  return (
    <>
      <title>Live Telemetry | Agni Sakthi</title>
      <meta
        name="description"
        content="Real-time circular gauge monitor for drying deck temperatures, PCM latent core, and ESP32 telemetry."
      />
      <div className="space-y-6">
        {/* Top Banner */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Live Monitor</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            {buzzerError && (
              <span className="text-xs text-rose-600 font-medium">{buzzerError}</span>
            )}

            <button
              onClick={handleTestBuzzer}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-all touch-target ${
                buzzerTestTriggered
                  ? "bg-rose-50 border-rose-300 text-rose-700"
                  : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
              }`}
            >
              {isAdmin ? <Volume2 className="w-4 h-4 text-amber-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
              <span>{buzzerTestTriggered ? "Buzzer Sounding!" : isAdmin ? "Test Alert Buzzer" : "Test Buzzer (Admin Only)"}</span>
            </button>
          </div>
        </div>

        {/* 3 Circular Dial Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GaugeMeter
            title="Tray 1"
            subtitle="Upper Deck"
            value={t1}
            accentColor="#f97316"
            min={20}
            max={90}
            warn={warnTray1}
            crit={critTray1}
            isStaleOrOffline={isStale || isOffline}
          />
          <GaugeMeter
            title="Tray 2"
            subtitle="Lower Deck"
            value={t2}
            accentColor="#6366f1"
            min={20}
            max={90}
            warn={warnTray2}
            crit={critTray2}
            isStaleOrOffline={isStale || isOffline}
          />
          <GaugeMeter
            title="PCM Core"
            subtitle="Thermal Bed"
            value={pcm}
            accentColor="#059669"
            min={20}
            max={65}
            warn={warnPcm}
            crit={critPcm}
            isStaleOrOffline={isStale || isOffline}
          />
        </div>

        {/* Chamber Cross-Section Diagram */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
            Airflow & Chamber Layout
          </h3>

          <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 p-6 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800 shadow-2xs text-center w-full md:w-1/4">
              <Wind className="w-6 h-6 text-amber-500 mx-auto animate-bounce" />
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 mt-2">Solar Intake</h4>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800 shadow-2xs text-center w-full md:w-1/4">
              <Layers className="w-6 h-6 text-amber-600 mx-auto" />
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 mt-2">Tray 1</h4>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {formatTempUnit(t1)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800 shadow-2xs text-center w-full md:w-1/4">
              <Layers className="w-6 h-6 text-indigo-600 mx-auto" />
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mt-2">Tray 2</h4>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {formatTempUnit(t2)}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs text-center w-full md:w-1/4">
              <Flame className="w-6 h-6 text-emerald-600 mx-auto" />
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 mt-2">PCM Core</h4>
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {formatTempUnit(pcm)}
              </span>
            </div>
          </div>
        </div>
    </div>
  </>
);
}
