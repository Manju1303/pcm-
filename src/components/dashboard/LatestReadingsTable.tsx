"use client";

import React, { useState } from "react";
import { TelemetryReading } from "@/types/telemetry";
import { generateTelemetryCsv, downloadCsvFile } from "@/lib/export";
import { formatTime, formatDate } from "@/lib/utils";
import {
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";

interface LatestReadingsTableProps {
  readings: TelemetryReading[];
}

export function LatestReadingsTable({ readings }: LatestReadingsTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  const sortedReadings = [...readings].reverse();
  const totalPages = Math.max(1, Math.ceil(sortedReadings.length / pageSize));
  const displayedReadings = sortedReadings.slice(page * pageSize, (page + 1) * pageSize);

  const handleExportCsv = () => {
    const csvData = generateTelemetryCsv(readings);
    const dateStr = new Date().toISOString().split("T")[0];
    downloadCsvFile(csvData, `solar-dryer-readings-${dateStr}.csv`);
  };

  const renderStatusDot = (status: string) => {
    if (status === "ok") return <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />;
    if (status === "stale") return <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />;
    return <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Table Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-sm text-slate-900">
            Live Telemetry Log
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Real sensor frames recorded from the solar dryer
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-mono"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>

          {readings.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Timestamp (Local)</th>
              <th className="py-2.5 px-3">Tray 1 (°C)</th>
              <th className="py-2.5 px-3">Tray 2 (°C)</th>
              <th className="py-2.5 px-3">PCM Temp (°C)</th>
              <th className="py-2.5 px-3">Operating Status</th>
              <th className="py-2.5 px-3 text-right">Battery (V)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {displayedReadings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <Radio className="w-6 h-6 text-slate-400 animate-pulse mb-1" />
                    <span className="font-medium text-slate-700 text-xs">No live telemetry recorded yet</span>
                    <span className="text-[11px] text-slate-400">Power on your ESP32 controller to start streaming data</span>
                  </div>
                </td>
              </tr>
            ) : (
              displayedReadings.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-600">
                    {formatDate(r.timestamp)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center space-x-1.5 text-sky-700 font-medium">
                      {renderStatusDot(r.sensors.tray1)}
                      <span>{r.temperatures.tray1 !== null ? `${r.temperatures.tray1.toFixed(1)}°` : "--"}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center space-x-1.5 text-indigo-700 font-medium">
                      {renderStatusDot(r.sensors.tray2)}
                      <span>{r.temperatures.tray2 !== null ? `${r.temperatures.tray2.toFixed(1)}°` : "--"}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                      {renderStatusDot(r.sensors.pcm)}
                      <span>{r.temperatures.pcm !== null ? `${r.temperatures.pcm.toFixed(1)}°` : "--"}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-sans px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                      {r.operatingStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 font-medium">
                    {r.batteryVoltage !== undefined && r.batteryVoltage !== null
                      ? `${r.batteryVoltage.toFixed(2)} V`
                      : "--"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-600 font-mono">
          <span>
            Page {page + 1} of {totalPages} ({sortedReadings.length} total entries)
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1 rounded bg-slate-100 disabled:opacity-40 text-slate-600 hover:bg-slate-200 border border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 rounded bg-slate-100 disabled:opacity-40 text-slate-600 hover:bg-slate-200 border border-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
