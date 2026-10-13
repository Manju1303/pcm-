"use client";

import React, { useState } from "react";
import { TelemetryReading } from "@/types/telemetry";
import { formatTime, formatDate, formatTemp } from "@/lib/utils";
import { generateTelemetryCsv, downloadCsvFile } from "@/lib/export";
import { FileSpreadsheet, List, ChevronLeft, ChevronRight } from "lucide-react";

interface LatestReadingsTableProps {
  readings: TelemetryReading[];
}

export function LatestReadingsTable({ readings }: LatestReadingsTableProps) {
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const reversed = [...readings].reverse();
  const totalPages = Math.max(1, Math.ceil(reversed.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const displayed = reversed.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);

  const handleExportCsv = () => {
    const csv = generateTelemetryCsv(readings);
    downloadCsvFile(csv, "solar-dryer-telemetry-log.csv");
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
      {/* Table Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <List className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Telemetry Log
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Row limit selector */}
          <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as 10 | 25 | 50);
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 text-xs font-mono"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {readings.length > 0 && (
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {readings.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 text-xs">
          No telemetry frames ingested yet. Awaiting ESP32 hardware transmission.
        </div>
      ) : (
        <>
          {/* Desktop Table with Sticky Header */}
          <div className="hidden sm:block overflow-x-auto max-h-96 border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Tray 1 (Upper)</th>
                  <th className="py-2.5 px-3">Tray 2 (Lower)</th>
                  <th className="py-2.5 px-3">PCM Core</th>
                  <th className="py-2.5 px-3">Operating Mode</th>
                  <th className="py-2.5 px-3 text-right">Frame Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {displayed.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                      {formatTime(row.timestamp)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-sky-700 dark:text-sky-300">
                      {row.temperatures.tray1 !== null ? `${row.temperatures.tray1.toFixed(1)}°C` : "--"}
                    </td>
                    <td className="py-2 px-3 font-semibold text-indigo-700 dark:text-indigo-300">
                      {row.temperatures.tray2 !== null ? `${row.temperatures.tray2.toFixed(1)}°C` : "--"}
                    </td>
                    <td className="py-2 px-3 font-semibold text-emerald-700 dark:text-emerald-300">
                      {row.temperatures.pcm !== null ? `${row.temperatures.pcm.toFixed(1)}°C` : "--"}
                    </td>
                    <td className="py-2 px-3 font-sans text-[11px] text-slate-700 dark:text-slate-300">
                      {row.operatingStatus}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {row.sensors.tray1 === "ok" && row.sensors.tray2 === "ok" && row.sensors.pcm === "ok" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-sans font-semibold">
                          OK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-sans font-semibold">
                          FAULT
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout (under 640px) */}
          <div className="sm:hidden space-y-2.5">
            {displayed.map((row) => (
              <div
                key={row.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {formatDate(row.timestamp)} {formatTime(row.timestamp)}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium">
                    {row.operatingStatus}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Tray 1</span>
                    <span className="font-bold text-sky-700 dark:text-sky-300">
                      {row.temperatures.tray1 !== null ? `${row.temperatures.tray1.toFixed(1)}°C` : "--"}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Tray 2</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">
                      {row.temperatures.tray2 !== null ? `${row.temperatures.tray2.toFixed(1)}°C` : "--"}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">PCM Core</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {row.temperatures.pcm !== null ? `${row.temperatures.pcm.toFixed(1)}°C` : "--"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Page {pageIndex} of {totalPages} ({readings.length} total rows)
              </span>
              <div className="flex items-center space-x-1">
                <button
                  disabled={pageIndex <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pageIndex >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
