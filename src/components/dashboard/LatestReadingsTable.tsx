"use client";

import React, { useState } from "react";
import { TelemetryReading } from "@/types/telemetry";
import { generateTelemetryCsv, downloadCsvFile } from "@/lib/export";
import { formatTime, formatDate } from "@/lib/utils";
import {
  Table,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface LatestReadingsTableProps {
  readings: TelemetryReading[];
}

export function LatestReadingsTable({ readings }: LatestReadingsTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  // Latest readings in reverse chronological order
  const sortedReadings = [...readings].reverse();
  const totalPages = Math.ceil(sortedReadings.length / pageSize);
  const displayedReadings = sortedReadings.slice(page * pageSize, (page + 1) * pageSize);

  const handleExportCsv = () => {
    const csvData = generateTelemetryCsv(readings);
    const dateStr = new Date().toISOString().split("T")[0];
    downloadCsvFile(csvData, `solar-dryer-readings-${dateStr}.csv`);
  };

  const renderStatusDot = (status: string) => {
    if (status === "ok") return <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />;
    if (status === "stale") return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />;
    return <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
      {/* Table Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-sm text-slate-200">
            Latest Telemetry Log
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Individual sensor frames received and processed
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Page size selector */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 font-mono"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Timestamp (Local)</th>
              <th className="py-2.5 px-3">Tray 1 (°C)</th>
              <th className="py-2.5 px-3">Tray 2 (°C)</th>
              <th className="py-2.5 px-3">PCM Temp (°C)</th>
              <th className="py-2.5 px-3">Operating Status</th>
              <th className="py-2.5 px-3">Battery (V)</th>
              <th className="py-2.5 px-3 text-right">Data Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {displayedReadings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                  No telemetry recorded yet. Awaiting hardware ingress.
                </td>
              </tr>
            ) : (
              displayedReadings.map((r) => (
                <tr key={r.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-2.5 px-3 text-slate-400">
                    {formatDate(r.timestamp)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center space-x-1.5 text-sky-400">
                      {renderStatusDot(r.sensors.tray1)}
                      <span>{r.temperatures.tray1 !== null ? `${r.temperatures.tray1.toFixed(1)}°` : "--"}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center space-x-1.5 text-indigo-400">
                      {renderStatusDot(r.sensors.tray2)}
                      <span>{r.temperatures.tray2 !== null ? `${r.temperatures.tray2.toFixed(1)}°` : "--"}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                      {renderStatusDot(r.sensors.pcm)}
                      <span>{r.temperatures.pcm !== null ? `${r.temperatures.pcm.toFixed(1)}°` : "--"}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-sans px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {r.operatingStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {r.batteryVoltage !== undefined && r.batteryVoltage !== null
                      ? `${r.batteryVoltage.toFixed(2)} V`
                      : "--"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {r.isDemo ? (
                      <span className="font-sans text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                        DEMO
                      </span>
                    ) : (
                      <span className="font-sans text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                        HARDWARE
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-slate-400 font-mono">
          <span>
            Page {page + 1} of {totalPages} ({sortedReadings.length} total entries)
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1 rounded bg-slate-800 disabled:opacity-40 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 rounded bg-slate-800 disabled:opacity-40 text-slate-300 hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
