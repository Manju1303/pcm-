"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  RefreshCw,
  Milestone,
  Save,
  Cpu,
  Layers,
} from "lucide-react";
import { ProjectPhase } from "@/types/telemetry";

export default function AdminPage() {
  const {
    isAdmin,
    loginAdmin,
    logoutAdmin,
    projectPhases,
    refreshAll,
    clearAllActiveAlerts,
  } = useTelemetry();

  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Project phase editing state
  const [phasesList, setPhasesList] = useState<ProjectPhase[]>(projectPhases);
  const [savingPhaseId, setSavingPhaseId] = useState<number | null>(null);
  const [phaseSuccess, setPhaseSuccess] = useState<number | null>(null);

  // Buzzer test state
  const [testingBuzzer, setTestingBuzzer] = useState<"buzzer1" | "buzzer2" | null>(null);
  const [buzzerMsg, setBuzzerMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setPhasesList(projectPhases);
  }, [projectPhases]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await loginAdmin(passcode);
      if (!res.success) {
        setAuthError(res.error || "Authentication failed");
      } else {
        setPasscode("");
      }
    } catch {
      setAuthError("Network error while connecting to server auth endpoint");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdatePhase = async (phase: ProjectPhase) => {
    setSavingPhaseId(phase.phaseNumber);
    setPhaseSuccess(null);

    try {
      const res = await fetch("/api/project-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseNumber: phase.phaseNumber,
          status: phase.status,
          note: phase.note,
        }),
      });

      if (res.ok) {
        setPhaseSuccess(phase.phaseNumber);
        await refreshAll();
        setTimeout(() => setPhaseSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update phase:", err);
    } finally {
      setSavingPhaseId(null);
    }
  };

  const handleTestBuzzer = async (buzzer: "buzzer1" | "buzzer2") => {
    setTestingBuzzer(buzzer);
    setBuzzerMsg(null);

    try {
      const res = await fetch("/api/buzzer/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buzzer, durationMs: 1500 }),
      });
      const data = await res.json();
      if (res.ok) {
        setBuzzerMsg(`Dispatched test pulse to ${buzzer === "buzzer1" ? "Warning (GPIO 25)" : "Critical (GPIO 26)"} buzzer`);
      } else {
        setBuzzerMsg(data.error || "Buzzer test rejected");
      }
    } catch {
      setBuzzerMsg("Network error dispatching buzzer test");
    } finally {
      setTestingBuzzer(null);
    }
  };

  if (!isAdmin) {
    return (
      <>
        <title>Admin Login & Passcode Authentication | Solar Dryer IoT</title>
        <meta
          name="description"
          content="Administrator authentication portal for threshold management and project roadmap editing."
        />

        <div className="max-w-md mx-auto my-12 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Administrator Access</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Enter the supervisor passcode to access hardware telemetry controls, threshold editing, and project roadmap management.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter admin passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={authLoading}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-center text-slate-900 dark:text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-hidden"
              />
              {authError && (
                <div className="p-2.5 mt-2 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading || !passcode}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-xs disabled:opacity-50"
            >
              {authLoading ? "Authenticating on Server..." : "Unlock Admin Console"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Protected by server-side session cookies & IP rate limiting (5 attempts per 15 min).
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <title>Admin Console & Roadmap Management | Solar Dryer IoT</title>
      <meta
        name="description"
        content="Administrator dashboard for project status milestones, hardware buzzer diagnostics, and system configuration."
      />

      <div className="space-y-6">
        {/* Title Header */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Administrator Console & Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage project roadmaps, test hardware buzzers, and configure system thresholds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => logoutAdmin()}
              className="text-xs text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 font-semibold transition-colors"
            >
              Lock Console (Logout)
            </button>
          </div>
        </div>

        {/* Item 3: Project Status Phase Editor */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Milestone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Project Status & College Evaluation Roadmap (Item 3)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Edit phase status and technical notes stored in Supabase. These display read-only on the Overview dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {phasesList.map((phase) => (
              <div
                key={phase.phaseNumber}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Phase {phase.phaseNumber}: {phase.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={phase.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as any;
                        setPhasesList((prev) =>
                          prev.map((p) =>
                            p.phaseNumber === phase.phaseNumber ? { ...p, status: newStatus } : p
                          )
                        );
                      }}
                      className="text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 font-medium text-slate-800 dark:text-slate-200"
                    >
                      <option value="Not started">Not started</option>
                      <option value="In progress">In progress</option>
                      <option value="Done">Done</option>
                    </select>

                    <button
                      onClick={() => handleUpdatePhase(phase)}
                      disabled={savingPhaseId === phase.phaseNumber}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingPhaseId === phase.phaseNumber ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                    Technical Evaluation Note / Progress Summary:
                  </label>
                  <input
                    type="text"
                    value={phase.note || ""}
                    onChange={(e) => {
                      const newNote = e.target.value;
                      setPhasesList((prev) =>
                        prev.map((p) =>
                          p.phaseNumber === phase.phaseNumber ? { ...p, note: newNote } : p
                        )
                      );
                    }}
                    placeholder="Add progress note or physical status..."
                    className="w-full text-xs p-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {phaseSuccess === phase.phaseNumber && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Phase {phase.phaseNumber} status updated in Supabase database!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Item 5: Test Alert Buzzer Diagnostics */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Hardware Local Buzzer Diagnostics (Item 5)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dispatch an authenticated test pulse to verify transistor switching on GPIO 25 (Warning) and GPIO 26 (Critical).
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => handleTestBuzzer("buzzer1")}
              disabled={testingBuzzer !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>Test Buzzer 1 (Warning - GPIO 25)</span>
            </button>

            <button
              onClick={() => handleTestBuzzer("buzzer2")}
              disabled={testingBuzzer !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>Test Buzzer 2 (Critical - GPIO 26)</span>
            </button>
          </div>

          {buzzerMsg && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono">
              {buzzerMsg}
            </div>
          )}
        </div>

        {/* System Maintenance Controls */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
          <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
            System Maintenance & Synchronisation
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => refreshAll()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Synchronize Supabase Data</span>
            </button>
            <button
              onClick={() => clearAllActiveAlerts()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <span>Clear Stored Client Alarms</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
