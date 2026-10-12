"use client";

import React from "react";
import { WiringDiagramView } from "@/components/hardware/WiringDiagramView";
import { Wrench } from "lucide-react";

export default function WiringAndHelpPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5">
        <div className="flex items-center space-x-2">
          <Wrench className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            Hardware Wiring, GPIO Pinout & Commissioning Guide
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Complete electrical schematic connections, resistor divider safety, 1-Wire pull-ups, and step-by-step verification checklist for the ESP32 solar dryer.
        </p>
      </div>

      <WiringDiagramView />
    </div>
  );
}
