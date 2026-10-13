"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  LayoutDashboard,
  Activity,
  Flame,
  BellRing,
  MoreHorizontal,
  X,
  LineChart,
  Cpu,
  Wrench,
  Settings,
  ShieldCheck,
} from "lucide-react";

export function BottomTabBar() {
  const pathname = usePathname();
  const { activeAlerts } = useTelemetry();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const alertCount = activeAlerts.length;

  const PRIMARY_TABS = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Live", href: "/live", icon: Activity },
    { name: "PCM", href: "/pcm", icon: Flame },
    { name: "Alerts", href: "/alerts", icon: BellRing, badge: alertCount },
  ];

  const MORE_ITEMS = [
    { name: "Thermal Analytics", href: "/analytics", icon: LineChart, desc: "Historical gradients & CSV export" },
    { name: "Sensor Health", href: "/health", icon: Cpu, desc: "DS18B20 64-bit ROM inventory & faults" },
    { name: "Wiring & Pinout", href: "/wiring", icon: Wrench, desc: "Schematics & commissioning checklist" },
    { name: "System Settings", href: "/settings", icon: Settings, desc: "Thresholds, feature flags, API key" },
    { name: "Admin Panel", href: "/admin", icon: ShieldCheck, desc: "Passcode auth, sensor mapping, project status" },
  ];

  const isMoreActive = MORE_ITEMS.some((item) => item.href === pathname);

  return (
    <>
      {/* Mobile Bottom Tab Bar (under 768px) */}
      <nav
        aria-label="Mobile navigation bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe shadow-lg"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {PRIMARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setShowMoreSheet(false)}
                className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors relative ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold font-mono bg-rose-500 text-white">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1">{tab.name}</span>
              </Link>
            );
          })}

          {/* "More" Trigger Tab */}
          <button
            type="button"
            onClick={() => setShowMoreSheet(true)}
            aria-label="More navigation items"
            aria-expanded={showMoreSheet}
            className={`flex flex-col items-center justify-center flex-1 h-full touch-target transition-colors ${
              isMoreActive || showMoreSheet
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-1">More</span>
          </button>
        </div>
      </nav>

      {/* "More" Slide-up Sheet */}
      {showMoreSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMoreSheet(false)}
          />

          {/* Sheet Content */}
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl max-h-[85vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">System Navigation</h3>
              <button
                type="button"
                onClick={() => setShowMoreSheet(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close more sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreSheet(false)}
                    className={`flex items-start space-x-3 p-3 rounded-xl transition-all touch-target ${
                      isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isActive
                          ? "bg-emerald-600 text-white"
                          : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-semibold ${
                          isActive
                            ? "text-emerald-900 dark:text-emerald-300"
                            : "text-slate-900 dark:text-slate-100"
                        }`}
                      >
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
