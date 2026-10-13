"use client";

import React, { useState } from "react";
import { PcmCalibrationConfig } from "@/types/telemetry";
import {
  Settings2,
  Calculator,
  ShieldAlert,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface PcmThermalExplainerProps {
  currentPcmTemp: number | null;
  config: PcmCalibrationConfig;
  onUpdateConfig: (config: PcmCalibrationConfig) => void;
  isAdmin?: boolean;
}

export function PcmThermalExplainer({
  currentPcmTemp,
  config,
  onUpdateConfig,
  isAdmin = false,
}: PcmThermalExplainerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PcmCalibrationConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Theoretical Maximum Latent Storage = mass x latent heat (Requirement 18)
  const mass = formData.massKg || 2.5;
  const latent = formData.latentHeatKjKg || 190.0;
  const totalLatentHeatKj = mass * latent; // 2.5 x 190 = 475 kJ
  const totalLatentHeatKwh = totalLatentHeatKj / 3600.0; // 475 / 3600 = 0.1319 kWh

  // Check if heat loss and airflow parameters are entered
  const hasHeatLoss = formData.chamberHeatLossRateW > 0;
  const hasAirflow = formData.airflowRateM3h > 0;
  const isRuntimeUnlocked = hasHeatLoss && hasAirflow;

  const missingFields: string[] = [];
  if (!hasHeatLoss) missingFields.push("Chamber Heat Loss Rate (Watts)");
  if (!hasAirflow) missingFields.push("Airflow Rate (m³/h)");

  // Estimated runtime when unlocked
  const estimatedHoursRuntime = isRuntimeUnlocked
    ? totalLatentHeatKj / (formData.chamberHeatLossRateW * 3.6)
    : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...formData,
      isCalibrated: isRuntimeUnlocked,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>PCM parameters updated successfully.</span>
        </div>
      )}

      {/* Calibration & Theoretical Latent Storage Model */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center space-x-2.5">
            <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              PCM Parameters & Capacity
            </h3>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors touch-target"
          >
            <Settings2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isEditing ? "Close Editor" : "Edit Parameters"}</span>
          </button>
        </div>

        {/* Parameters Editor */}
        {isEditing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                PCM Material Name
              </label>
              <input
                type="text"
                value={formData.materialType}
                onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                PCM Net Mass (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.massKg}
                onChange={(e) => setFormData({ ...formData, massKg: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Latent Heat of Fusion (kJ/kg)
              </label>
              <input
                type="number"
                step="1"
                min="10"
                value={formData.latentHeatKjKg}
                onChange={(e) => setFormData({ ...formData, latentHeatKjKg: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Melting Range Min (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.meltingMinC}
                onChange={(e) => setFormData({ ...formData, meltingMinC: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Melting Range Max (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.meltingMaxC}
                onChange={(e) => setFormData({ ...formData, meltingMaxC: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Nominal Phase Plateau (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.phaseChangeTempC}
                onChange={(e) => setFormData({ ...formData, phaseChangeTempC: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Chamber Heat Loss Rate (Watts) <span className="text-slate-400">(0 = unentered)</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.chamberHeatLossRateW}
                onChange={(e) => setFormData({ ...formData, chamberHeatLossRateW: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Airflow Rate (m³/h) <span className="text-slate-400">(0 = unentered)</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.airflowRateM3h}
                onChange={(e) => setFormData({ ...formData, airflowRateM3h: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs"
              >
                Save PCM Parameters
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Material */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Installed Material</span>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{config.materialType}</div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">Mass: {config.massKg} kg</div>
            </div>

            {/* Melting Range & Plateau */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Melting Range</span>
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                {config.meltingMinC}°C – {config.meltingMaxC}°C
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                Latent: {config.latentHeatKjKg} kJ/kg
              </div>
            </div>

            {/* Theoretical Maximum Latent Storage (Requirement 18: mass x latent heat) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Max Latent Storage</span>
              <div className="text-sm font-bold text-amber-700 dark:text-amber-400 font-mono">
                {totalLatentHeatKj.toFixed(0)} kJ
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                = {totalLatentHeatKwh.toFixed(2)} kWh thermal
              </div>
              <div className="text-[10px] text-slate-400 italic">
                ({config.massKg} kg &times; {config.latentHeatKjKg} kJ/kg)
              </div>
            </div>

            {/* Estimated Runtime - Locked until parameters are entered */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Estimated Runtime</span>
              {isRuntimeUnlocked ? (
                <>
                  <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                    ~{estimatedHoursRuntime.toFixed(1)} Hours
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Under {config.chamberHeatLossRateW}W loss & {config.airflowRateM3h} m³/h airflow
                  </div>
                </>
              ) : (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Locked (Uncalibrated)</span>
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400">
                    Missing parameters: {missingFields.join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
