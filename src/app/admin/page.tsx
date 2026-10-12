"use client";

import React, { useState } from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Terminal,
  Send,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export default function AdminPage() {
  const { ingestReading, clearAllActiveAlerts } = useTelemetry();
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Simulation injector states
  const [mockTray1, setMockTray1] = useState(48.5);
  const [mockTray2, setMockTray2] = useState(44.2);
  const [mockPcm, setMockPcm] = useState(52.0);
  const [mockStatus1, setMockStatus1] = useState<"ok" | "disconnected" | "faulty">("ok");
  const [mockStatus2, setMockStatus2] = useState<"ok" | "disconnected" | "faulty">("ok");
  const [mockStatusPcm, setMockStatusPcm] = useState<"ok" | "disconnected" | "faulty">("ok");
  const [mockBattery, setMockBattery] = useState(12.6);
  const [injectSuccess, setInjectSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "admin2026" || passcode === "admin") {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const handleInjectTelemetry = (e: React.FormEvent) => {
    e.preventDefault();
    const reading = {
      id: `manual-inject-${Date.now()}`,
      deviceId: "solar-dryer-01",
      timestamp: new Date().toISOString(),
      temperatures: {
        tray1: mockStatus1 === "ok" ? mockTray1 : null,
        tray2: mockStatus2 === "ok" ? mockTray2 : null,
        pcm: mockStatusPcm === "ok" ? mockPcm : null,
      },
      sensors: {
        tray1: mockStatus1,
        tray2: mockStatus2,
        pcm: mockStatusPcm,
      },
      batteryVoltage: mockBattery,
      operatingStatus: "Unknown/Not Configured" as const, // will be evaluated by engine
      isDemo: false,
    };

    ingestReading(reading);
    setInjectSuccess(true);
    setTimeout(() => setInjectSuccess(false), 2500);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-xl border border-slate-800 bg-slate-900/90 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-100">Administrator Access Required</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Enter supervisor passcode to access hardware telemetry injection and diagnostic tools.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter passcode (default: admin2026)"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-center text-slate-200 font-mono text-sm focus:border-emerald-500 outline-none"
            />
            {authError && (
              <p className="text-rose-400 text-xs mt-1.5">Incorrect passcode. Try &apos;admin2026&apos;</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
          >
            Unlock Admin Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">
            Administrator Testing & Injection Console
          </h2>
        </div>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 border border-slate-700"
        >
          Lock Panel
        </button>
      </div>

      {injectSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Test telemetry frame successfully injected into runtime pipeline!</span>
        </div>
      )}

      {/* Manual Telemetry Injector Tool */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="font-semibold text-sm text-slate-200 mb-1">
          Hardware Fault & Overheat Simulation Injector
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Test system resilience, buzzer triggers, and threshold actions by injecting arbitrary sensor frames.
        </p>

        <form onSubmit={handleInjectTelemetry} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tray 1 */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-sky-400 block">Tray 1 Probe</span>
              <div>
                <label className="text-slate-400 block mb-0.5">Value (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={mockTray1}
                  onChange={(e) => setMockTray1(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Health State</label>
                <select
                  value={mockStatus1}
                  onChange={(e) => setMockStatus1(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                >
                  <option value="ok">OK (Normal)</option>
                  <option value="disconnected">Disconnected (-127°C)</option>
                  <option value="faulty">Faulty (85°C Reset)</option>
                </select>
              </div>
            </div>

            {/* Tray 2 */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-indigo-400 block">Tray 2 Probe</span>
              <div>
                <label className="text-slate-400 block mb-0.5">Value (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={mockTray2}
                  onChange={(e) => setMockTray2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Health State</label>
                <select
                  value={mockStatus2}
                  onChange={(e) => setMockStatus2(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                >
                  <option value="ok">OK (Normal)</option>
                  <option value="disconnected">Disconnected (-127°C)</option>
                  <option value="faulty">Faulty (85°C Reset)</option>
                </select>
              </div>
            </div>

            {/* PCM */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-emerald-400 block">PCM Reservoir</span>
              <div>
                <label className="text-slate-400 block mb-0.5">Value (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={mockPcm}
                  onChange={(e) => setMockPcm(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Health State</label>
                <select
                  value={mockStatusPcm}
                  onChange={(e) => setMockStatusPcm(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                >
                  <option value="ok">OK (Normal)</option>
                  <option value="disconnected">Disconnected (-127°C)</option>
                  <option value="faulty">Faulty (85°C Reset)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={clearAllActiveAlerts}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700"
            >
              Clear Active Alarms
            </button>

            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Inject Telemetry Frame</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
