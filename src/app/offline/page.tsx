"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, ArrowLeft } from "lucide-react";
import { formatTime } from "@/lib/utils";

export default function OfflinePage() {
  const [cachedTime, setCachedTime] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("solar_dryer_real_readings");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const latest = parsed[parsed.length - 1];
            if (latest?.timestamp) {
              setCachedTime(latest.timestamp);
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
        <WifiOff className="w-8 h-8" />
      </div>

      <div className="space-y-1 max-w-md">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Network Offline
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {cachedTime
            ? `Offline - cached data from ${formatTime(cachedTime)}`
            : "Offline - no cached telemetry available"}
        </p>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm">
        The application is currently disconnected from the network. Cached views and historical readings remain available locally.
      </p>

      <div className="flex items-center space-x-3 pt-2">
        <button
          onClick={handleRetry}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>

        <Link
          href="/"
          className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
