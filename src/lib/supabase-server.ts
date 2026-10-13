import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  TelemetryReading,
  ProjectPhase,
  NightTestResult,
  SensorFaultEvent,
  AlertEvent,
  SystemSettings,
} from "@/types/telemetry";

let supabaseServerClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient | null {
  if (supabaseServerClient) return supabaseServerClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey && !url.includes("placeholder")) {
    try {
      supabaseServerClient = createClient(url, serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      return supabaseServerClient;
    } catch (err) {
      console.warn("Failed initializing Supabase server client:", err);
      return null;
    }
  }

  return null;
}

/**
 * Persists telemetry frame to Supabase if connected
 */
export async function persistReadingToSupabase(reading: TelemetryReading): Promise<boolean> {
  const supabase = getSupabaseServer();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("sensor_readings").insert({
      device_id: reading.deviceId,
      timestamp: reading.timestamp,
      tray1_temp: reading.temperatures.tray1,
      tray2_temp: reading.temperatures.tray2,
      pcm_temp: reading.temperatures.pcm,
      tray1_status: reading.sensors.tray1,
      tray2_status: reading.sensors.tray2,
      pcm_status: reading.sensors.pcm,
      tray1_rom: reading.romAddresses?.tray1 || null,
      tray2_rom: reading.romAddresses?.tray2 || null,
      pcm_rom: reading.romAddresses?.pcm || null,
      buzzer1_ok: reading.buzzerState?.buzzer1_ok ?? null,
      buzzer2_ok: reading.buzzerState?.buzzer2_ok ?? null,
      battery_voltage: reading.batteryVoltage ?? null,
      moisture_percent: reading.moisturePercent ?? null,
      operating_status: reading.operatingStatus,
      is_demo: false,
      raw_payload: reading,
    });

    if (error) {
      console.warn("Supabase insert error (sensor_readings):", error.message);
      return false;
    }

    // Update devices last_seen_at
    await supabase
      .from("devices")
      .update({
        last_seen_at: reading.timestamp,
        buzzer1_ok: reading.buzzerState?.buzzer1_ok ?? null,
        buzzer2_ok: reading.buzzerState?.buzzer2_ok ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reading.deviceId);

    return true;
  } catch (err) {
    console.warn("Failed inserting reading into Supabase:", err);
    return false;
  }
}

/**
 * Persists sensor fault event to Supabase
 */
export async function persistSensorFaultToSupabase(
  deviceId: string,
  fault: SensorFaultEvent
): Promise<boolean> {
  const supabase = getSupabaseServer();
  if (!supabase) return false;

  try {
    await supabase.from("sensor_faults").insert({
      device_id: deviceId,
      sensor: fault.sensor,
      fault_type: fault.faultType,
      raw_value: fault.rawValue ?? null,
      rom_address: fault.romAddress ?? null,
      message: fault.message,
      detected_at: fault.timestamp,
    });
    return true;
  } catch (err) {
    console.warn("Failed inserting fault into Supabase:", err);
    return false;
  }
}
