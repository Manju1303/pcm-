/**
 * @file config.h
 * @brief Network and Operational Configuration for ESP32 Solar Dryer
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// --- Device Identity ---
#define DEVICE_ID                 "solar-dryer-01"
#define FIRMWARE_VERSION          "v1.0.0-prod"

// --- Wi-Fi Credentials ---
// Configure for your local 2.4GHz Wi-Fi network
#define WIFI_SSID                 "YOUR_WIFI_SSID"
#define WIFI_PASSWORD             "YOUR_WIFI_PASSWORD"

// --- Backend API Ingestion Endpoint ---
// Replace with your deployed Next.js URL or local server IP (e.g. "http://192.168.1.100:3000/api/telemetry")
#define API_SERVER_URL            "http://192.168.1.100:3000/api/telemetry"
#define API_KEY                   "sd_secret_key_college_dryer_2026"  // Must match API_INGEST_KEY in .env

// --- Reporting Intervals (milliseconds) ---
#define TELEMETRY_INTERVAL_MS     10000   // Send reading every 10 seconds
#define OLED_REFRESH_INTERVAL_MS  2000    // Refresh display every 2 seconds
#define SENSOR_READ_INTERVAL_MS   3000    // Read temperature probes every 3 seconds

// --- Operational & Alert Thresholds (°C) ---
#define TRAY1_WARN_HIGH           55.0f
#define TRAY1_CRIT_HIGH           65.0f
#define TRAY1_WARN_LOW            30.0f

#define TRAY2_WARN_HIGH           55.0f
#define TRAY2_CRIT_HIGH           65.0f
#define TRAY2_WARN_LOW            30.0f

#define PCM_CHARGE_START          45.0f   // PCM begins absorbing sensible/latent heat
#define PCM_PHASE_CHANGE_TEMP     50.0f   // Latent phase change nominal plateau (e.g. paraffin RT50)
#define PCM_WARN_HIGH             60.0f   // Overheat threshold
#define PCM_CRIT_HIGH             70.0f   // Critical threshold

// Alert Hysteresis to prevent buzzer chatter (°C)
#define ALERT_HYSTERESIS          1.5f
// Buzzer cooldown period in milliseconds
#define BUZZER_COOLDOWN_MS        30000   // 30 seconds between loud buzzer bursts

// --- Optional GSM Configuration ---
#define GSM_ALERT_PHONE_NUMBER    "+919876543210"

#endif // CONFIG_H
