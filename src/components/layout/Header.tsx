"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatTime } from "@/lib/utils";
import {
  Sun,
  Flame,
  Clock,
  Download,
  AlertTriangle,
  Radio,
  CheckCircle2,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function Header() {
  const {
    isOnline,
    isStale,
    lastSyncTime,
    activeAlerts,
  } = useTelemetry();

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Project Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Sun className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <Link href="/" className="font-bold text-base sm:text-lg text-slate-900 hover:text-emerald-600 transition-colors tracking-tight">
                Solar Dryer IoT
              </Link>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                PCM Storage
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              2 Product Trays • Thermal Energy Storage • Real-Time Monitoring
            </p>
          </div>
        </div>

        {/* Live Status and Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Connection Status Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-slate-50 border-slate-200">
            {isOnline && !isStale ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 font-semibold">Live Online</span>
              </>
            ) : isStale ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-700 font-medium">Stale Data</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-slate-600 font-medium">Awaiting ESP32</span>
              </>
            )}
          </div>

          {/* Last Sync Time */}
          <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Last Sync: <strong className="text-slate-700 font-mono">{lastSyncTime ? formatTime(lastSyncTime) : "None"}</strong></span>
          </div>

          {/* Alert Badge Indicator */}
          {activeAlerts.length > 0 && (
            <Link
              href="/alerts"
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-colors"
              title={`${activeAlerts.length} active alarm(s)`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{activeAlerts.length}</span>
            </Link>
          )}

          {/* Install PWA Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              title="Install progressive web app"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
