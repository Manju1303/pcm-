"use client";

import React from "react";
import { WiringDiagramView } from "@/components/hardware/WiringDiagramView";
import { Wrench, ShieldAlert, Cpu } from "lucide-react";

export default function WiringAndHelpPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center space-x-2">
          <Wrench className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">
            Hardware Wiring, GPIO Pinout & Commissioning Guide
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Complete electrical schematic connections, resistor divider safety, 1-Wire pull-ups, and step-by-step verification checklist for the ESP32 solar dryer.
        </p>
      </div>

      <WiringDiagramView />
    </div>
  );
}
