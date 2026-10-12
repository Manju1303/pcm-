"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatTime } from "@/lib/utils";
import {
  Sun,
  Flame,
  Wifi,
  WifiOff,
  Clock,
  Download,
  Moon,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Sliders,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function Header() {
  const {
    isOnline,
    isStale,
    isDemoMode,
    lastSyncTime,
    setDemoMode,
    activeAlerts,
    deviceMetadata,
  } = useTelemetry();

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      alert("To install this dashboard on your home screen:\n\nChrome/Android: Tap Menu (⋮) -> 'Install App' or 'Add to Home screen'\nSafari/iOS: Tap Share -> 'Add to Home Screen'");
      return;
    }
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("light");
      setIsDark(false);
    } else {
      root.classList.remove("light");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      {/* Demo Mode Top Banner */}
      {isDemoMode && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-1 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="font-semibold tracking-wide">SIMULATED DEMO DATA ACTIVE</span>
            <span className="hidden md:inline text-amber-200/80">
              — Demonstrating 24h solar drying and PCM phase-change release cycle.
            </span>
          </div>
          <button
            onClick={() => setDemoMode(false)}
            className="text-xs bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 px-2 py-0.5 rounded border border-amber-400/30 transition-colors"
          >
            Switch to Real Hardware
          </button>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sun className="w-6 h-6 text-amber-300 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <Link href="/" className="font-bold text-base sm:text-lg text-slate-100 hover:text-emerald-400 transition-colors tracking-tight">
                Solar Dryer IoT
              </Link>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                PCM Storage
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              2 Trays • Thermal Energy Storage • Dual Buzzer Alert Controller
            </p>
          </div>
        </div>

        {/* Center / Right Status & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Connection Status Pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-800/80 border-slate-700">
            {isOnline && !isStale ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400">Online</span>
              </>
            ) : isStale ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-400">Stale Data</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-rose-400">Offline</span>
              </>
            )}
          </div>

          {/* Last Sync Time */}
          <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Sync: <strong className="text-slate-200">{formatTime(lastSyncTime)}</strong></span>
          </div>

          {/* Alert Badge Indicator */}
          {activeAlerts.length > 0 && (
            <Link
              href="/alerts"
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800/60 text-xs animate-pulse hover:bg-rose-900/90"
              title={`${activeAlerts.length} active alarm(s)`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold">{activeAlerts.length}</span>
            </Link>
          )}

          {/* Demo Mode Toggle Button */}
          <button
            onClick={() => setDemoMode(!isDemoMode)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1 ${
              isDemoMode
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
            title="Toggle between Simulated Demo Data and Real Hardware"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDemoMode ? "Demo Mode" : "Real Device"}</span>
          </button>

          {/* Install PWA Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              title="Install progressive web app for offline monitoring"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Toggle dark / light theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
}
