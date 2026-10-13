"use client";

import React from "react";
import Link from "next/link";
import { useTelemetry } from "@/context/TelemetryContext";
import { AlertCircle, ChevronRight } from "lucide-react";

export function TopCriticalBanner() {
  const { activeAlerts } = useTelemetry();

  const criticalAlerts = activeAlerts.filter((a) => a.severity === "critical");

  if (criticalAlerts.length === 0) return null;

  const topAlert = criticalAlerts[0];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-rose-600 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between border-b border-rose-700 shadow-sm animate-pulse"
    >
      <div className="flex items-center space-x-2.5 max-w-4xl truncate">
        <AlertCircle className="w-4 h-4 shrink-0 text-white" />
        <span className="font-bold uppercase tracking-wider bg-rose-800 px-1.5 py-0.5 rounded text-[10px]">
          CRITICAL ALARM
        </span>
        <span className="truncate">{topAlert.message}</span>
        {criticalAlerts.length > 1 && (
          <span className="text-rose-200 shrink-0 font-normal">
            (+{criticalAlerts.length - 1} more)
          </span>
        )}
      </div>

      <Link
        href="/alerts"
        className="shrink-0 flex items-center space-x-1 underline hover:text-rose-100 font-semibold text-xs ml-3"
      >
        <span>View Alerts</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
