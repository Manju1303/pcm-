"use client";

import React, { useState } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatTime, formatTemp } from "@/lib/utils";
import {
  Activity,
  Radio,
  Wind,
  Flame,
  Layers,
  Thermometer,
  Zap,
  Volume2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

export default function LiveMonitoringPage() {
  const { currentReading, isOnline, isStale, isDemoMode } = useTelemetry();
  const [buzzerTestTriggered, setBuzzerTestTriggered] = useState(false);

  const t1 = currentReading?.temperatures.tray1 ?? null;
  const t2 = currentReading?.temperatures.tray2 ?? null;
  const pcm = currentReading?.temperatures.pcm ?? null;

  // Temperature Dial Gauge Component
  const GaugeMeter = ({
    title,
    value,
    unit = "°C",
    min = 20,
    max = 80,
    accentColor = "#10b981",
    subtitle,
  }: {
    title: string;
    value: number | null;
    unit?: string;
    min?: number;
    max?: number;
    accentColor?: string;
    subtitle: string;
  }) => {
    const val = value ?? min;
    const percentage = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
    const strokeDashoffset = 251.2 - (251.2 * percentage * 0.75) / 100;

    return (
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col items-center text-center relative overflow-hidden">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</h4>
        <p className="text-[11px] text-slate-500 mb-3">{subtitle}</p>

        {/* SVG Circular Gauge */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-135" viewBox="0 0 100 100">
            {/* Background Arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset="62.8"
              strokeLinecap="round"
            />
            {/* Foreground Animated Gauge */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={accentColor}
              strokeWidth="8"
              strokeDasharray="251.2"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Centered Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-bold text-slate-100">
              {value !== null ? value.toFixed(1) : "--.-"}
            </span>
            <span className="text-xs text-slate-400 font-mono mt-0.5">{unit}</span>
          </div>
        </div>

        <div className="flex justify-between w-full text-[10px] text-slate-500 font-mono mt-1 px-4">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    );
  };

  const handleTestBuzzer = () => {
    setBuzzerTestTriggered(true);
    // Play local audio beep in browser
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio Context beep", e);
    }
    setTimeout(() => setBuzzerTestTriggered(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h2 className="text-base font-bold text-slate-100">High-Frequency Live Chamber Monitor</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry stream refreshes dynamically. Observing thermal equilibrium across both drying decks and the PCM bed.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleTestBuzzer}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all ${
              buzzerTestTriggered
                ? "bg-rose-500/30 border-rose-500 text-rose-300"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>{buzzerTestTriggered ? "Buzzer Sounding!" : "Test Alert Buzzer"}</span>
          </button>
        </div>
      </div>

      {/* 3 Circular Dial Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GaugeMeter
          title="Tray 1 (Top Deck)"
          subtitle="Direct Solar Collector Inlet"
          value={t1}
          accentColor="#38bdf8"
          min={20}
          max={75}
        />
        <GaugeMeter
          title="Tray 2 (Bottom Deck)"
          subtitle="Intermediate Exhaust Flow Deck"
          value={t2}
          accentColor="#818cf8"
          min={20}
          max={75}
        />
        <GaugeMeter
          title="PCM Thermal Reservoir"
          subtitle="Paraffin Wax RT-50 Latent Bed"
          value={pcm}
          accentColor="#10b981"
          min={20}
          max={75}
        />
      </div>

      {/* Chamber Cross-Section Diagram */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="font-semibold text-sm text-slate-200 mb-1">
          Chamber Thermodynamics & Airflow Diagram
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Visualizing convective air currents and conductive thermal flux inside the enclosure
        </p>

        <div className="relative border border-slate-700/80 rounded-xl bg-slate-950 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Solar Collector Air Intake */}
          <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-800/40 text-center w-full md:w-1/4">
            <Wind className="w-6 h-6 text-amber-400 mx-auto animate-bounce" />
            <h4 className="text-xs font-bold text-amber-300 mt-2">Solar Air Intake</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Collector heats incoming ambient air</p>
          </div>

          {/* Tray 1 Deck */}
          <div className="p-4 rounded-lg bg-sky-950/40 border border-sky-800/50 text-center w-full md:w-1/4">
            <Layers className="w-6 h-6 text-sky-400 mx-auto" />
            <h4 className="text-xs font-bold text-sky-300 mt-2">Tray 1: {formatTemp(t1)}°C</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Top produce layer</p>
          </div>

          {/* Tray 2 Deck */}
          <div className="p-4 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-center w-full md:w-1/4">
            <Layers className="w-6 h-6 text-indigo-400 mx-auto" />
            <h4 className="text-xs font-bold text-indigo-300 mt-2">Tray 2: {formatTemp(t2)}°C</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Bottom produce layer</p>
          </div>

          {/* PCM Base Bed */}
          <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-center w-full md:w-1/4">
            <Flame className="w-6 h-6 text-emerald-400 mx-auto" />
            <h4 className="text-xs font-bold text-emerald-300 mt-2">PCM Bed: {formatTemp(pcm)}°C</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Thermal storage core</p>
          </div>
        </div>
      </div>
    </div>
  );
}
