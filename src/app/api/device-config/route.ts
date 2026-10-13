import { NextRequest, NextResponse } from "next/server";
import { verifyDeviceApiKey } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  // 1. Constant-time API Key Verification
  if (!verifyDeviceApiKey(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Invalid or missing x-api-key header." },
      { status: 401 }
    );
  }

  // 2. Fetch from Supabase if configured, otherwise return defaults
  const supabase = getSupabaseServer();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("device_configs")
        .select("*")
        .eq("device_id", "solar-dryer-01")
        .single();

      if (!error && data) {
        return NextResponse.json({
          deviceId: data.device_id,
          sendIntervalSec: data.send_interval_sec || 60,
          thresholds: {
            tray1Warn: parseFloat(data.tray1_warn_c) || 58.0,
            tray1Crit: parseFloat(data.tray1_crit_c) || 68.0,
            tray2Warn: parseFloat(data.tray2_warn_c) || 58.0,
            tray2Crit: parseFloat(data.tray2_crit_c) || 68.0,
            pcmWarn: parseFloat(data.pcm_warn_c) || 60.0,
            pcmCrit: parseFloat(data.pcm_crit_c) || 72.0,
            pcmChargeTrigger: parseFloat(data.pcm_charge_trigger_c) || 45.0,
            pcmPlateau: parseFloat(data.pcm_plateau_c) || 50.0,
            pcmDischargeDelta: parseFloat(data.pcm_discharge_delta_c) || 2.0,
          },
          battery: {
            dividerRatio: parseFloat(data.battery_divider_ratio) || 5.545,
            offsetV: parseFloat(data.battery_offset_v) || 0.0,
          },
          sensorMapping: {
            tray1Rom: data.tray1_rom || "",
            tray2Rom: data.tray2_rom || "",
            pcmRom: data.pcm_rom || "",
          },
          featureFlags: {
            gsmEnabled: data.gsm_enabled ?? false,
            moistureEnabled: data.moisture_enabled ?? false,
            batteryMonitorEnabled: data.battery_monitor_enabled ?? false,
          },
        });
      }
    } catch (err) {
      console.warn("Could not query device_configs in Supabase:", err);
    }
  }

  // Fallback defaults
  return NextResponse.json({
    deviceId: "solar-dryer-01",
    sendIntervalSec: 60,
    thresholds: {
      tray1Warn: 58.0,
      tray1Crit: 68.0,
      tray2Warn: 58.0,
      tray2Crit: 68.0,
      pcmWarn: 60.0,
      pcmCrit: 72.0,
      pcmChargeTrigger: 45.0,
      pcmPlateau: 50.0,
      pcmDischargeDelta: 2.0,
    },
    battery: {
      dividerRatio: 5.545,
      offsetV: 0.0,
    },
    sensorMapping: {
      tray1Rom: "",
      tray2Rom: "",
      pcmRom: "",
    },
    featureFlags: {
      gsmEnabled: false,
      moistureEnabled: false,
      batteryMonitorEnabled: false,
    },
  });
}
