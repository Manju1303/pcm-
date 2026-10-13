"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  LayoutDashboard,
  Activity,
  LineChart,
  Flame,
  BellRing,
  Cpu,
  Wrench,
  Settings,
  ShieldCheck,
  Sun,
  Lock,
} from "lucide-react";

interface NavGroup {
  group: string;
  items: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }>;
}

export function Sidebar() {
  const pathname = usePathname();
  const { activeAlerts, isAdmin } = useTelemetry();

  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;
  const alertCount = activeAlerts.length;

  const NAV_GROUPS: NavGroup[] = [
    {
      group: "Monitor",
      items: [
        { name: "Overview", href: "/", icon: LayoutDashboard },
        { name: "Live Monitor", href: "/live", icon: Activity },
        { name: "Analytics", href: "/analytics", icon: LineChart },
        { name: "PCM Storage", href: "/pcm", icon: Flame },
      ],
    },
    {
      group: "Safety",
      items: [
        { name: "Alerts", href: "/alerts", icon: BellRing, badge: alertCount },
        { name: "Sensor Health", href: "/health", icon: Cpu },
      ],
    },
    {
      group: "System",
      items: [
        { name: "Wiring & Pinout", href: "/wiring", icon: Wrench },
        { name: "Settings", href: "/settings", icon: Settings },
        { name: "Admin", href: "/admin", icon: ShieldCheck },
      ],
    },
  ];

  return (
    <aside
      aria-label="Sidebar navigation"
      className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-4rem)] p-4 space-y-6"
    >
      <nav className="space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.group}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 block mb-2 font-mono">
              {group.group}
            </span>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all touch-target ${
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                            criticalCount > 0
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Admin Status Footer */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between px-2">
          <span>Role:</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
              isAdmin
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {isAdmin ? "Supervisor (Admin)" : "Visitor (Read-only)"}
          </span>
        </div>
      </div>
    </aside>
  );
}
