"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Live Monitor", href: "/live", icon: Activity },
  { name: "Analytics", href: "/analytics", icon: LineChart },
  { name: "PCM Storage", href: "/pcm", icon: Flame },
  { name: "Alerts", href: "/alerts", icon: BellRing },
  { name: "Sensor Health", href: "/health", icon: Cpu },
  { name: "Wiring & Pinout", href: "/wiring", icon: Wrench },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Admin", href: "/admin", icon: ShieldCheck },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-16 z-30 overflow-x-auto no-scrollbar shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 py-2 min-w-max">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-500"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
