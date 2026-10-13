/**
 * @file config.h
 * @brief Network and Operational Configuration for ESP32 Solar Dryer
 * 
 * IMPORTANT:
 * - Rotate API_KEY to match DEVICE_API_KEY in your Next.js server environment (.env).
 * - Fallback thresholds below ensure autonomous local buzzer operation when Wi-Fi is unavailable.
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// --- Device Identity ---
#define DEVICE_ID                 "solar-dryer-01"
#define FIRMWARE_VERSION          "v1.1.0-prod"

// --- Wi-Fi Credentials ---
// Configure for your local 2.4GHz Wi-Fi network
#define WIFI_SSID                 "YOUR_WIFI_SSID"
#define WIFI_PASSWORD             "YOUR_WIFI_PASSWORD"

// --- Backend API Ingestion Endpoint & Authentication ---
// Replace with your deployed Next.js URL or local server IP (e.g. "https://pcm-six.vercel.app/api/telemetry")
#define API_SERVER_URL            "https://pcm-six.vercel.app/api/telemetry"
#define CONFIG_SERVER_URL         "https://pcm-six.vercel.app/api/device-config"

// IMPORTANT SECURITY NOTE: Replace with your actual secret key matching DEVICE_API_KEY in .env.local / Vercel
#define API_KEY                   "YOUR_DEVICE_API_KEY"

// --- Reporting Intervals (milliseconds) ---
#define TELEMETRY_INTERVAL_MS     60000   // Send reading every 60 seconds (matches server sendIntervalSec)
#define CONFIG_FETCH_INTERVAL_MS  300000  // Refresh thresholds from server every 5 minutes
#define OLED_REFRESH_INTERVAL_MS  2000    // Refresh display every 2 seconds
#define SENSOR_READ_INTERVAL_MS   3000    // Read temperature probes every 3 seconds

// --- Hardcoded Offline Fallback Thresholds (°C) ---
// Used directly by onboard buzzer safety logic when offline or before config fetch
#define FALLBACK_TRAY1_WARN_HIGH  58.0f
#define FALLBACK_TRAY1_CRIT_HIGH  68.0f
#define FALLBACK_TRAY2_WARN_HIGH  58.0f
#define FALLBACK_TRAY2_CRIT_HIGH  68.0f

#define FALLBACK_PCM_CHARGE_START 45.0f   // PCM begins absorbing sensible/latent heat
#define FALLBACK_PCM_PLATEAU      50.0f   // Latent phase change nominal plateau (e.g. paraffin RT50)
#define FALLBACK_PCM_WARN_HIGH    60.0f   // Overheat threshold
#define FALLBACK_PCM_CRIT_HIGH    72.0f   // Critical threshold
#define FALLBACK_DISCHARGE_DELTA  2.0f    // Discharge threshold delta (PCM > Tray Mean + Delta)

// Alert Hysteresis to prevent buzzer chatter (°C)
#define ALERT_HYSTERESIS          1.5f
// Buzzer cooldown period in milliseconds
#define BUZZER_COOLDOWN_MS        30000   // 30 seconds between loud buzzer bursts

// --- Optional GSM Configuration ---
#define GSM_ALERT_PHONE_NUMBER    "+919876543210"

#endif // CONFIG_H
