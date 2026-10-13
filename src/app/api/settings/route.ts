import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-server";
import { SystemSettings } from "@/types/telemetry";
import { DEFAULT_PCM_CONFIG } from "@/lib/operating-mode";

// In-memory fallback settings
let inMemorySettings: SystemSettings = {
  thresholds: {
    tray1Warn: 58.0,
    tray1Crit: 68.0,
    tray2Warn: 58.0,
    tray2Crit: 68.0,
    pcmWarn: 60.0,
    pcmCrit: 72.0,
    pcmChargeTrigger: 45.0,
    pcmPlateau: 50.0,
    dischargeDelta: 2.0,
    sendIntervalSec: 60,
    batteryDividerRatio: 5.545,
    batteryCalibrationOffset: 0.0,
  },
  pcmConfig: DEFAULT_PCM_CONFIG,
  featureFlags: {
    gsmEnabled: false,
    moistureEnabled: false,
    batteryMonitorEnabled: false,
  },
  sensorMapping: {
    tray1Rom: "",
    tray2Rom: "",
    pcmRom: "",
  },
  detectedAddresses: [],
};

export async function GET(req: NextRequest) {
  const isAdmin = verifyAdminSession(req);
  const supabase = getSupabaseServer();

  let settings = { ...inMemorySettings };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("device_configs")
        .select("*")
        .eq("device_id", "solar-dryer-01")
        .single();

      if (!error && data) {
        settings = {
          thresholds: {
            tray1Warn: parseFloat(data.tray1_warn_c) || 58.0,
            tray1Crit: parseFloat(data.tray1_crit_c) || 68.0,
            tray2Warn: parseFloat(data.tray2_warn_c) || 58.0,
            tray2Crit: parseFloat(data.tray2_crit_c) || 68.0,
            pcmWarn: parseFloat(data.pcm_warn_c) || 60.0,
            pcmCrit: parseFloat(data.pcm_crit_c) || 72.0,
            pcmChargeTrigger: parseFloat(data.pcm_charge_trigger_c) || 45.0,
            pcmPlateau: parseFloat(data.pcm_plateau_c) || 50.0,
            dischargeDelta: parseFloat(data.pcm_discharge_delta_c) || 2.0,
            sendIntervalSec: data.send_interval_sec || 60,
            batteryDividerRatio: parseFloat(data.battery_divider_ratio) || 5.545,
            batteryCalibrationOffset: parseFloat(data.battery_offset_v) || 0.0,
          },
          pcmConfig: {
            materialType: data.pcm_material_name || "Paraffin RT-50",
            massKg: parseFloat(data.pcm_mass_kg) || 2.5,
            latentHeatKjKg: parseFloat(data.pcm_latent_heat_kj_kg) || 190.0,
            phaseChangeTempC: parseFloat(data.pcm_plateau_c) || 50.0,
            chargeStartTempC: parseFloat(data.pcm_charge_trigger_c) || 45.0,
            dischargeThresholdDeltaC: parseFloat(data.pcm_discharge_delta_c) || 2.0,
            meltingMinC: parseFloat(data.pcm_melting_min_c) || 45.0,
            meltingMaxC: parseFloat(data.pcm_melting_max_c) || 51.0,
            chamberHeatLossRateW: parseFloat(data.chamber_heat_loss_rate_w) || 0.0,
            airflowRateM3h: parseFloat(data.airflow_rate_m3h) || 0.0,
            isCalibrated: data.is_calibrated ?? false,
          },
          featureFlags: {
            gsmEnabled: data.gsm_enabled ?? false,
            moistureEnabled: data.moisture_enabled ?? false,
            batteryMonitorEnabled: data.battery_monitor_enabled ?? false,
          },
          sensorMapping: {
            tray1Rom: data.tray1_rom || "",
            tray2Rom: data.tray2_rom || "",
            pcmRom: data.pcm_rom || "",
          },
          detectedAddresses: inMemorySettings.detectedAddresses,
        };
      }
    } catch (err) {
      console.warn("Could not query Supabase device_configs:", err);
    }
  }

  // If admin is authenticated, include deviceApiKey securely from environment
  return NextResponse.json({
    settings,
    isAdmin,
    deviceApiKey: isAdmin ? process.env.DEVICE_API_KEY || null : null,
  });
}

export async function POST(req: NextRequest) {
  // 1. Require admin session
  if (!verifyAdminSession(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Administrator session required to modify settings." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { thresholds, pcmConfig, featureFlags, sensorMapping } = body;

    if (thresholds) {
      inMemorySettings.thresholds = { ...inMemorySettings.thresholds, ...thresholds };
    }
    if (pcmConfig) {
      inMemorySettings.pcmConfig = { ...inMemorySettings.pcmConfig, ...pcmConfig };
    }
    if (featureFlags) {
      inMemorySettings.featureFlags = { ...inMemorySettings.featureFlags, ...featureFlags };
    }
    if (sensorMapping) {
      inMemorySettings.sensorMapping = { ...inMemorySettings.sensorMapping, ...sensorMapping };
    }

    // Persist to Supabase if connected
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase
        .from("device_configs")
        .upsert({
          device_id: "solar-dryer-01",
          tray1_warn_c: inMemorySettings.thresholds.tray1Warn,
          tray1_crit_c: inMemorySettings.thresholds.tray1Crit,
          tray2_warn_c: inMemorySettings.thresholds.tray2Warn,
          tray2_crit_c: inMemorySettings.thresholds.tray2Crit,
          pcm_warn_c: inMemorySettings.thresholds.pcmWarn,
          pcm_crit_c: inMemorySettings.thresholds.pcmCrit,
          pcm_charge_trigger_c: inMemorySettings.thresholds.pcmChargeTrigger,
          pcm_plateau_c: inMemorySettings.thresholds.pcmPlateau,
          pcm_discharge_delta_c: inMemorySettings.thresholds.dischargeDelta,
          send_interval_sec: inMemorySettings.thresholds.sendIntervalSec,
          battery_divider_ratio: inMemorySettings.thresholds.batteryDividerRatio,
          battery_offset_v: inMemorySettings.thresholds.batteryCalibrationOffset,
          gsm_enabled: inMemorySettings.featureFlags.gsmEnabled,
          moisture_enabled: inMemorySettings.featureFlags.moistureEnabled,
          battery_monitor_enabled: inMemorySettings.featureFlags.batteryMonitorEnabled,
          tray1_rom: inMemorySettings.sensorMapping.tray1Rom,
          tray2_rom: inMemorySettings.sensorMapping.tray2Rom,
          pcm_rom: inMemorySettings.sensorMapping.pcmRom,
          pcm_material_name: inMemorySettings.pcmConfig.materialType,
          pcm_mass_kg: inMemorySettings.pcmConfig.massKg,
          pcm_latent_heat_kj_kg: inMemorySettings.pcmConfig.latentHeatKjKg,
          pcm_melting_min_c: inMemorySettings.pcmConfig.meltingMinC,
          pcm_melting_max_c: inMemorySettings.pcmConfig.meltingMaxC,
          chamber_heat_loss_rate_w: inMemorySettings.pcmConfig.chamberHeatLossRateW,
          airflow_rate_m3h: inMemorySettings.pcmConfig.airflowRateM3h,
          is_calibrated: inMemorySettings.pcmConfig.isCalibrated,
          updated_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: inMemorySettings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
