"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatRelativeTime, formatExactDateTime } from "@/lib/utils";
import {
  Sun,
  Moon,
  Clock,
  Download,
  AlertTriangle,
  Radio,
  Share,
  X,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function Header() {
  const {
    isOnline,
    isStale,
    isOffline,
    lastSyncTime,
    activeAlerts,
  } = useTelemetry();

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Detect iOS and Standalone mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      setIsInstalled(isStandalone);

      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIos(isIosDevice);

      // Detect theme preference
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        setIsDark(true);
        document.documentElement.classList.add("dark");
      } else {
        setIsDark(false);
        document.documentElement.classList.remove("dark");
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleInstallClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setInstallPrompt(null);
      }
    } else if (isIos) {
      setShowIosPrompt(true);
    }
  };

  // Determine Status Pill
  const hasCriticalAlarm = activeAlerts.some((a) => a.severity === "critical");
  let statusBadge = {
    label: "Offline",
    color: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300",
    dot: "bg-rose-500",
  };

  if (hasCriticalAlarm) {
    statusBadge = {
      label: "Alarm Active",
      color: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-400 animate-pulse font-bold",
      dot: "bg-rose-600 animate-ping",
    };
  } else if (isOffline || !lastSyncTime) {
    statusBadge = {
      label: "Offline",
      color: "bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400 border-rose-300",
      dot: "bg-rose-500",
    };
  } else if (isStale) {
    statusBadge = {
      label: "Stale Data",
      color: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300",
      dot: "bg-amber-500",
    };
  } else if (isOnline) {
    statusBadge = {
      label: "Live Online",
      color: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300",
      dot: "bg-emerald-500 animate-pulse",
    };
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand & Project Identity */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xs">
                <Sun className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                    Solar Dryer IoT
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.2 text-[10px] font-mono uppercase tracking-wider rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    PCM Core
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Dual Trays • Thermal Energy Storage • ESP32
                </p>
              </div>
            </Link>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Status Pill with aria-live="polite" */}
            <div
              aria-live="polite"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
              <span className="font-mono">{statusBadge.label}</span>
            </div>

            {/* Last Sync (relative + exact hover) */}
            <div
              className="hidden lg:flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 cursor-help"
              title={formatExactDateTime(lastSyncTime)}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Sync: <strong className="text-slate-700 dark:text-slate-200 font-mono">{formatRelativeTime(lastSyncTime)}</strong>
              </span>
            </div>

            {/* Alert Indicator */}
            {activeAlerts.length > 0 && (
              <Link
                href="/alerts"
                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold touch-target"
                title={`${activeAlerts.length} active alarm(s)`}
                aria-label={`${activeAlerts.length} active alarm(s)`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="font-mono">{activeAlerts.length}</span>
              </Link>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 touch-target"
              title={isDark ? "Switch to light theme" : "Switch to dark theme"}
              aria-label="Toggle light and dark color theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Install PWA Button (shown only when prompt is available, or iOS hint) */}
            {!isInstalled && (installPrompt || isIos) && (
              <button
                onClick={handleInstallClick}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-2xs touch-target"
                title="Install Progressive Web App"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* iOS Add to Home Screen Prompt Modal */}
      {showIosPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Install on iPhone / iPad
              </h3>
              <button onClick={() => setShowIosPrompt(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              To install this solar dryer dashboard as a standalone PWA on iOS:
            </p>
            <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
              <li>
                Tap the Safari <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-sky-600" />
              </li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> in the top-right corner</li>
            </ol>
            <button
              onClick={() => setShowIosPrompt(false)}
              className="w-full py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
