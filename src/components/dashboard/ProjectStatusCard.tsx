"use client";

import React from "react";
import { ProjectPhase } from "@/types/telemetry";
import { CheckCircle2, Clock, CircleSlash, Milestone } from "lucide-react";

interface ProjectStatusCardProps {
  phases: ProjectPhase[];
}

export function ProjectStatusCard({ phases }: ProjectStatusCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Done":
        return {
          icon: CheckCircle2,
          color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300",
        };
      case "In progress":
        return {
          icon: Clock,
          color: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300",
        };
      case "Not started":
      default:
        return {
          icon: CircleSlash,
          color: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700",
        };
    }
  };

  const doneCount = phases.filter((p) => p.status === "Done").length;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Milestone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Project Development Roadmap & Verification Status
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              System implementation roadmap and component verification status
            </p>
          </div>
        </div>
        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
          Phases Completed: {doneCount} / {phases.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {phases.map((phase) => {
          const badge = getStatusBadge(phase.status);
          const Icon = badge.icon;

          return (
            <div
              key={phase.phaseNumber}
              className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-400 font-bold uppercase">
                  Phase {phase.phaseNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center space-x-1 ${badge.color}`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{phase.status}</span>
                </span>
              </div>

              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                {phase.title}
              </h4>

              {phase.note && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight italic pt-0.5">
                  &ldquo;{phase.note}&rdquo;
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
