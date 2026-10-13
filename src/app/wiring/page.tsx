"use client";

import React from "react";
import { WiringDiagramView } from "@/components/hardware/WiringDiagramView";
import { Wrench } from "lucide-react";

export default function WiringAndHelpPage() {
  return (
    <>
      <title>Hardware Wiring & Pinout Guide | Solar Dryer IoT</title>
      <meta
        name="description"
        content="Proposed ESP32 GPIO pinout, 1-Wire DS18B20 pull-up schematic, transistor-driven buzzer fail-safe circuits, and commissioning checklist."
      />

      <div className="space-y-6">
        {/* Title */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-5">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Hardware Wiring, GPIO Pinout & Commissioning Guide
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete electrical schematic connections, resistor divider safety, 1-Wire pull-ups, and step-by-step verification checklist for the ESP32 solar dryer.
          </p>
        </div>

        <WiringDiagramView />
      </div>
    </>
  );
}
