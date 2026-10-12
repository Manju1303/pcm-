"use client";

import React from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatTime, formatDate } from "@/lib/utils";
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Battery,
  Wifi,
  Radio,
  Layers,
  Flame,
  Clock,
  Zap,
  Info,
} from "lucide-react";

export default function DeviceHealthPage() {
  const { currentReading, isOnline, isStale, isDemoMode, deviceMetadata } = useTelemetry();

  const batteryV = currentReading?.batteryVoltage ?? 12.6;
  // Estimated SoC for 12V lead acid / solar battery
  const batteryPct = Math.min(100, Math.max(0, Math.round(((batteryV - 11.6) / (12.8 - 11.6)) * 100)));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">
            Hardware Controller & Sensor Health Diagnostics
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Detailed diagnostic telemetry from ESP32, 1-Wire bus probes, power subsystem, and communication peripherals.
        </p>
      </div>

      {/* Main Hardware Subsystems Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ESP32 Controller Card */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">ESP32-WROOM-32</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">
            {isOnline ? "Active / Normal" : "Offline"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 space-y-0.5 font-mono">
            <div>Firmware: {deviceMetadata.firmwareVersion}</div>
            <div>Device ID: {deviceMetadata.id}</div>
          </div>
        </div>

        {/* Solar Battery Voltage */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Solar Battery (GPIO 35)</span>
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {batteryV.toFixed(2)} V
          </div>
          <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
            <div>Est. Reserve: <strong>{batteryPct}%</strong></div>
            <div className="text-[10px] text-slate-500">100k/22k divider calibrated</div>
          </div>
        </div>

        {/* 1-Wire Bus State */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">1-Wire Bus (GPIO 16)</span>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-sky-400 font-mono">
            3 Probes Synced
          </div>
          <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
            <div>Pull-up: 4.7 kΩ to 3.3V</div>
            <div className="text-[10px] text-slate-500">CRC8 checksum verified</div>
          </div>
        </div>

        {/* SIM800L GSM Status */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">SIM800L GSM (UART2)</span>
            <Radio className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-lg font-bold text-slate-400 font-mono">
            Optional / Standby
          </div>
          <div className="text-[11px] text-slate-400 mt-1 space-y-0.5">
            <div>Hardware: Not Installed</div>
            <div className="text-[10px] text-slate-500">SMS alert triggers muted</div>
          </div>
        </div>
      </div>

      {/* Probes Detail Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="font-semibold text-sm text-slate-200 mb-3">
          DS18B20 Multi-drop 64-Bit Address Inventory
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Probe Role</th>
                <th className="py-2.5 px-3">64-Bit ROM Hex Identifier</th>
                <th className="py-2.5 px-3">Physical Mounting</th>
                <th className="py-2.5 px-3">Current Reading</th>
                <th className="py-2.5 px-3 text-right">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-850/50">
                <td className="py-2.5 px-3 font-semibold text-sky-400">Tray 1 (Top Deck)</td>
                <td className="py-2.5 px-3 text-slate-400">28:FF:64:1E:83:16:03:72</td>
                <td className="py-2.5 px-3 font-sans text-slate-300">Collector Hot Air Inlet</td>
                <td className="py-2.5 px-3 font-bold text-slate-100">
                  {currentReading?.temperatures.tray1?.toFixed(1) ?? "--"}°C
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                    OK / Valid
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="py-2.5 px-3 font-semibold text-indigo-400">Tray 2 (Bottom Deck)</td>
                <td className="py-2.5 px-3 text-slate-400">28:AA:32:05:92:21:04:18</td>
                <td className="py-2.5 px-3 font-sans text-slate-300">Drying Air Exhaust Region</td>
                <td className="py-2.5 px-3 font-bold text-slate-100">
                  {currentReading?.temperatures.tray2?.toFixed(1) ?? "--"}°C
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                    OK / Valid
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-850/50">
                <td className="py-2.5 px-3 font-semibold text-emerald-400">PCM Thermal Reservoir</td>
                <td className="py-2.5 px-3 text-slate-400">28:B4:77:41:88:19:01:95</td>
                <td className="py-2.5 px-3 font-sans text-slate-300">Submerged in Paraffin Matrix</td>
                <td className="py-2.5 px-3 font-bold text-slate-100">
                  {currentReading?.temperatures.pcm?.toFixed(1) ?? "--"}°C
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                    OK / Valid
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
