"use client";

import React, { useState } from "react";
import { PcmCalibrationConfig } from "@/types/telemetry";
import {
  Settings2,
  Calculator,
  ShieldAlert,
} from "lucide-react";

interface PcmThermalExplainerProps {
  currentPcmTemp: number | null;
  config: PcmCalibrationConfig;
  onUpdateConfig: (config: PcmCalibrationConfig) => void;
}

export function PcmThermalExplainer({
  currentPcmTemp,
  config,
  onUpdateConfig,
}: PcmThermalExplainerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PcmCalibrationConfig>(config);

  const totalLatentHeatKj = formData.massKg * formData.latentHeatKjKg;
  const totalLatentHeatKwh = totalLatentHeatKj / 3600.0;
  const estimatedHoursRuntime =
    formData.chamberHeatLossRateW > 0
      ? totalLatentHeatKj / (formData.chamberHeatLossRateW * 3.6)
      : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...formData,
      isCalibrated: true,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Scientific Disclaimer & Engineering Rigor Alert */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2 text-xs">
            <h4 className="text-sm font-bold text-amber-900">
              Thermodynamic Notice: Temperature vs. Latent Heat Storage
            </h4>
            <p className="text-slate-700 leading-relaxed">
              In phase change materials (PCMs) such as <strong>Paraffin Wax RT-50</strong>, heat absorption and release during phase change occurs isothermally (at a nearly constant temperature plateau of ~49°C - 51°C).
            </p>
            <p className="text-slate-600 leading-relaxed">
              <strong>Temperature alone cannot measure state of charge:</strong> A probe reading 50.0°C cannot distinguish whether the PCM is 10% molten or 95% molten. Precise energy storage and nocturnal drying runtime estimates require calibrated physical properties:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-amber-900 font-medium">
              <span className="p-1.5 rounded bg-white border border-amber-200 shadow-2xs">• PCM Net Mass (m, kg)</span>
              <span className="p-1.5 rounded bg-white border border-amber-200 shadow-2xs">• Latent Heat (&Delta;H_fus, kJ/kg)</span>
              <span className="p-1.5 rounded bg-white border border-amber-200 shadow-2xs">• Phase Temp (T_m, °C)</span>
              <span className="p-1.5 rounded bg-white border border-amber-200 shadow-2xs">• Heat Loss Rate (U&times;A, W/K)</span>
              <span className="p-1.5 rounded bg-white border border-amber-200 shadow-2xs">• Airflow Rate (Q_v, m³/h)</span>
              <span className="p-1.5 rounded bg-white border border-amber-200 shadow-2xs">• Crop Moisture Load</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Calibration & Thermal Model Dashboard */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center space-x-2.5">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                PCM Physical Parameters & Calibrated Storage Model
              </h3>
              <p className="text-[11px] text-slate-500">
                {config.isCalibrated
                  ? "Calibration active — displaying engineered capacity estimates."
                  : "Uncalibrated baseline — estimate mode locked until parameter validation."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isEditing ? "Close Editor" : "Edit Parameters"}</span>
          </button>
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 mb-1">PCM Material Name</label>
              <input
                type="text"
                value={formData.materialType}
                onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">PCM Mass (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.massKg}
                onChange={(e) => setFormData({ ...formData, massKg: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Latent Heat of Fusion (kJ/kg)</label>
              <input
                type="number"
                step="1"
                min="50"
                value={formData.latentHeatKjKg}
                onChange={(e) => setFormData({ ...formData, latentHeatKjKg: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Phase Change Plateau (°C)</label>
              <input
                type="number"
                step="0.5"
                value={formData.phaseChangeTempC}
                onChange={(e) => setFormData({ ...formData, phaseChangeTempC: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Charging Trigger Threshold (°C)</label>
              <input
                type="number"
                step="0.5"
                value={formData.chargeStartTempC}
                onChange={(e) => setFormData({ ...formData, chargeStartTempC: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Chamber Heat Loss Rate (Watts)</label>
              <input
                type="number"
                step="1"
                min="5"
                value={formData.chamberHeatLossRateW}
                onChange={(e) => setFormData({ ...formData, chamberHeatLossRateW: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono"
                required
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs"
              >
                Save & Enable Calibration
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-mono">Installed Material</span>
              <div className="text-base font-bold text-slate-900 mt-1">{config.materialType}</div>
              <div className="text-xs text-slate-600 mt-0.5 font-mono">Mass: {config.massKg} kg</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-mono">Phase Plateau</span>
              <div className="text-base font-bold text-emerald-700 mt-1 font-mono">
                {config.phaseChangeTempC.toFixed(1)} °C
              </div>
              <div className="text-xs text-slate-600 mt-0.5 font-mono">
                Latent: {config.latentHeatKjKg} kJ/kg
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-mono">Max Latent Storage</span>
              {config.isCalibrated ? (
                <>
                  <div className="text-base font-bold text-amber-700 mt-1 font-mono">
                    {totalLatentHeatKj.toFixed(0)} kJ
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 font-mono">
                    ≈ {totalLatentHeatKwh.toFixed(3)} kWh thermal
                  </div>
                </>
              ) : (
                <div className="text-xs text-amber-700 mt-2 font-mono">
                  Requires Calibration
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-mono">Estimated Runtime</span>
              {config.isCalibrated ? (
                <>
                  <div className="text-base font-bold text-indigo-700 mt-1 font-mono">
                    ~{estimatedHoursRuntime.toFixed(1)} Hours
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Under {config.chamberHeatLossRateW}W loss
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500 mt-2 font-mono">
                  Locked (Uncalibrated)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
