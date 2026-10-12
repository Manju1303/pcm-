"use client";

import React from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { formatTime, formatDate } from "@/lib/utils";
import {
  Cpu,
  Battery,
  Radio,
  Layers,
  Flame,
  Zap,
} from "lucide-react";

export default function DeviceHealthPage() {
  const { currentReading, isOnline, isStale, deviceMetadata } = useTelemetry();

  const batteryV = currentReading?.batteryVoltage ?? null;
  const batteryPct = batteryV !== null ? Math.min(100, Math.max(0, Math.round(((batteryV - 11.6) / (12.8 - 11.6)) * 100))) : null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900">
            Hardware Controller & Sensor Health Diagnostics
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Detailed diagnostic telemetry from ESP32, 1-Wire bus probes, power subsystem, and communication peripherals.
        </p>
      </div>

      {/* Main Hardware Subsystems Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ESP32 Controller Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">ESP32-WROOM-32</span>
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono">
            {isOnline ? "Active / Normal" : "Standby"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 space-y-0.5 font-mono">
            <div>Firmware: {deviceMetadata.firmwareVersion}</div>
            <div>Device ID: {deviceMetadata.id}</div>
          </div>
        </div>

        {/* Solar Battery Voltage */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Solar Battery (GPIO 35)</span>
            <Battery className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 font-mono">
            {batteryV !== null ? `${batteryV.toFixed(2)} V` : "--.- V"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
            <div>Est. Reserve: <strong>{batteryPct !== null ? `${batteryPct}%` : "Awaiting ADC"}</strong></div>
            <div className="text-[10px] text-slate-400">100k/22k divider calibrated</div>
          </div>
        </div>

        {/* 1-Wire Bus State */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">1-Wire Bus (GPIO 16)</span>
            <Zap className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-lg font-bold text-sky-700 font-mono">
            {isOnline ? "3 Probes Active" : "Bus Standby"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
            <div>Pull-up: 4.7 kΩ to 3.3V</div>
            <div className="text-[10px] text-slate-400">CRC8 checksum verified</div>
          </div>
        </div>

        {/* SIM800L GSM Status */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">SIM800L GSM (UART2)</span>
            <Radio className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-500 font-mono">
            Optional / Muted
          </div>
          <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
            <div>Hardware: Standby</div>
            <div className="text-[10px] text-slate-400">SMS alert triggers muted</div>
          </div>
        </div>
      </div>

      {/* Probes Detail Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h3 className="font-semibold text-sm text-slate-900 mb-3">
          DS18B20 Multi-drop Sensor Address Inventory
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Probe Role</th>
                <th className="py-2.5 px-3">Physical Mounting</th>
                <th className="py-2.5 px-3">Current Reading</th>
                <th className="py-2.5 px-3 text-right">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-sky-700">Tray 1 (Top Deck)</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Collector Hot Air Inlet</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">
                  {currentReading?.temperatures.tray1 !== null && currentReading?.temperatures.tray1 !== undefined ? `${currentReading.temperatures.tray1.toFixed(1)}°C` : "--.-°C"}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                    {isOnline ? "Active" : "Standby"}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-indigo-700">Tray 2 (Bottom Deck)</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Drying Air Exhaust Region</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">
                  {currentReading?.temperatures.tray2 !== null && currentReading?.temperatures.tray2 !== undefined ? `${currentReading.temperatures.tray2.toFixed(1)}°C` : "--.-°C"}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                    {isOnline ? "Active" : "Standby"}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-3 font-semibold text-emerald-700">PCM Thermal Reservoir</td>
                <td className="py-2.5 px-3 font-sans text-slate-600">Submerged in Paraffin Matrix</td>
                <td className="py-2.5 px-3 font-bold text-slate-900">
                  {currentReading?.temperatures.pcm !== null && currentReading?.temperatures.pcm !== undefined ? `${currentReading.temperatures.pcm.toFixed(1)}°C` : "--.-°C"}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                    {isOnline ? "Active" : "Standby"}
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
