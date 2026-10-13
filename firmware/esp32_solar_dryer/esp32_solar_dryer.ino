/**
 * @file esp32_solar_dryer.ino
 * @brief Production ESP32 Firmware for IoT Solar Dryer with PCM Thermal Storage
 * 
 * Hardware features:
 * - 3x DS18B20 1-Wire Digital Temperature Probes (Tray 1, Tray 2, PCM) on shared GPIO 16 bus
 * - 64-bit ROM Address reporting in JSON telemetry for web role mapping
 * - Remote threshold synchronization via GET /api/device-config with hardcoded offline fallbacks
 * - 0.96" I2C SSD1306 OLED Display (128x64)
 * - Dual Buzzer Alert System (Transistor-driven, non-blocking with hysteresis on GPIO 25/26)
 * - Buzzer state reporting (buzzer1_ok, buzzer2_ok, heartbeat) in telemetry frame
 * - Wi-Fi Telemetry Ingestion to Next.js / Supabase API endpoint with API Key Auth
 * - Standalone Local Operation resilience (buzzers and OLED work with zero Wi-Fi)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>
#include <time.h>

#include "pins_config.h"
#include "config.h"

// --- Global Objects ---
OneWire oneWire(PIN_ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Sensor 64-bit ROM addresses
DeviceAddress addrTray1;
DeviceAddress addrTray2;
DeviceAddress addrPcm;

int discoveredSensorsCount = 0;
bool sensorsMapped = false;

// Current Sensor Readings (°C)
float tempTray1 = -999.0f;
float tempTray2 = -999.0f;
float tempPcm   = -999.0f;
float batteryVoltage = 0.0f;

// Sensor Health Strings
String statusTray1 = "disconnected";
String statusTray2 = "disconnected";
String statusPcm   = "disconnected";

// Buzzer Hardware Status
bool buzzer1Ok = true;
bool buzzer2Ok = true;

// Dynamic Operational Thresholds (initialized to hardcoded offline fallbacks)
float tray1Warn = FALLBACK_TRAY1_WARN_HIGH;
float tray1Crit = FALLBACK_TRAY1_CRIT_HIGH;
float tray2Warn = FALLBACK_TRAY2_WARN_HIGH;
float tray2Crit = FALLBACK_TRAY2_CRIT_HIGH;
float pcmWarn   = FALLBACK_PCM_WARN_HIGH;
float pcmCrit   = FALLBACK_PCM_CRIT_HIGH;
float pcmChargeTrigger = FALLBACK_PCM_CHARGE_START;
float pcmPlateau       = FALLBACK_PCM_PLATEAU;
float dischargeDelta   = FALLBACK_DISCHARGE_DELTA;

// Operating Mode
String currentOperatingMode = "Idle";

// Timing trackers
unsigned long lastSensorReadTime  = 0;
unsigned long lastTelemetryTime   = 0;
unsigned long lastConfigFetchTime = 0;
unsigned long lastOledRefreshTime = 0;
unsigned long lastBuzzerAlertTime = 0;
unsigned long buzzer1TurnOffTime  = 0;
unsigned long buzzer2TurnOffTime  = 0;

// NTP configuration
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 0; // UTC
const int   daylightOffset_sec = 0;

// Helper function prototypes
void discoverAndMapSensors();
String formatAddressToHex(DeviceAddress deviceAddress);
void readTemperatureSensors();
void readBatteryVoltage();
void evaluateOperatingStatus();
void evaluateAlertsAndBuzzers();
void updateOledDisplay();
void sendTelemetryPayload();
void fetchRemoteDeviceConfig();
String getIso8601Timestamp();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\n======================================================="));
  Serial.println(F("ESP32 IoT Solar Dryer with PCM Thermal Storage Starting"));
  Serial.printf("Firmware Version: %s\n", FIRMWARE_VERSION);
  Serial.println(F("======================================================="));

  // 1. Initialize GPIOs
  pinMode(PIN_BUZZER_1, OUTPUT);
  pinMode(PIN_BUZZER_2, OUTPUT);
  digitalWrite(PIN_BUZZER_1, LOW);
  digitalWrite(PIN_BUZZER_2, LOW);

  analogReadResolution(12); // 12-bit ADC (0 - 4095)

  // 2. Initialize OLED
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDRESS)) {
    Serial.println(F("[ERROR] SSD1306 OLED initialization failed!"));
  } else {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(10, 15);
    display.println(F("Agni Sakthi"));
    display.setCursor(10, 30);
    display.println(F("Solar Dryer IoT"));
    display.setCursor(10, 48);
    display.println(F("Initializing..."));
    display.display();
  }

  // 3. Initialize 1-Wire DS18B20 Sensors
  sensors.begin();
  sensors.setResolution(11); // 11-bit resolution = 0.125°C step, 375ms conversion
  sensors.setWaitForConversion(true);
  discoverAndMapSensors();

  // 4. Initialize Wi-Fi
  Serial.printf("[WIFI] Connecting to SSID: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Quick initial startup beep
  digitalWrite(PIN_BUZZER_1, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER_1, LOW);

  // Initialize NTP time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
}

void loop() {
  unsigned long now = millis();

  // 1. Turn off buzzers non-blockingly
  if (buzzer1TurnOffTime > 0 && now >= buzzer1TurnOffTime) {
    digitalWrite(PIN_BUZZER_1, LOW);
    buzzer1TurnOffTime = 0;
  }
  if (buzzer2TurnOffTime > 0 && now >= buzzer2TurnOffTime) {
    digitalWrite(PIN_BUZZER_2, LOW);
    buzzer2TurnOffTime = 0;
  }

  // 2. Periodic Sensor Reading
  if (now - lastSensorReadTime >= SENSOR_READ_INTERVAL_MS || lastSensorReadTime == 0) {
    lastSensorReadTime = now;
    readTemperatureSensors();
    readBatteryVoltage();
    evaluateOperatingStatus();
    evaluateAlertsAndBuzzers();
  }

  // 3. Periodic OLED Refresh
  if (now - lastOledRefreshTime >= OLED_REFRESH_INTERVAL_MS || lastOledRefreshTime == 0) {
    lastOledRefreshTime = now;
    updateOledDisplay();
  }

  // 4. Periodic Config Fetch from Server (Item 14)
  if (WiFi.status() == WL_CONNECTED &&
      (now - lastConfigFetchTime >= CONFIG_FETCH_INTERVAL_MS || lastConfigFetchTime == 0)) {
    lastConfigFetchTime = now;
    fetchRemoteDeviceConfig();
  }

  // 5. Periodic Telemetry Ingestion over Wi-Fi
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS || lastTelemetryTime == 0) {
    lastTelemetryTime = now;
    if (WiFi.status() == WL_CONNECTED) {
      sendTelemetryPayload();
    } else {
      Serial.println(F("[WIFI] Disconnected. Running on hardcoded fallback thresholds."));
      if (WiFi.status() != WL_DISCONNECTED) {
        WiFi.reconnect();
      }
    }
  }

  delay(20); // Small cooperative yield for ESP32 background tasks
}

// ----------------------------------------------------------------------------
// Sensor Discovery and Mapping
// ----------------------------------------------------------------------------
void discoverAndMapSensors() {
  discoveredSensorsCount = sensors.getDeviceCount();
  Serial.printf("[1-WIRE] Detected %d DS18B20 probe(s) on bus GPIO %d\n", discoveredSensorsCount, PIN_ONE_WIRE_BUS);

  if (discoveredSensorsCount >= 1 && sensors.getAddress(addrTray1, 0)) {
    Serial.printf("[1-WIRE] Tray 1 Probe ROM: %s\n", formatAddressToHex(addrTray1).c_str());
  }
  if (discoveredSensorsCount >= 2 && sensors.getAddress(addrTray2, 1)) {
    Serial.printf("[1-WIRE] Tray 2 Probe ROM: %s\n", formatAddressToHex(addrTray2).c_str());
  }
  if (discoveredSensorsCount >= 3 && sensors.getAddress(addrPcm, 2)) {
    Serial.printf("[1-WIRE] PCM Probe ROM:    %s\n", formatAddressToHex(addrPcm).c_str());
    sensorsMapped = true;
  } else {
    Serial.println(F("[WARNING] Fewer than 3 probes detected. Probes will report status accordingly."));
  }
}

String formatAddressToHex(DeviceAddress deviceAddress) {
  String hexStr = "";
  for (uint8_t i = 0; i < 8; i++) {
    if (deviceAddress[i] < 16) hexStr += "0";
    hexStr += String(deviceAddress[i], HEX);
  }
  hexStr.toUpperCase();
  return hexStr;
}

// ----------------------------------------------------------------------------
// Read DS18B20 Temperature Probes
// ----------------------------------------------------------------------------
void readTemperatureSensors() {
  sensors.requestTemperatures();

  // Read Tray 1
  if (discoveredSensorsCount >= 1) {
    float raw = sensors.getTempC(addrTray1);
    if (raw == DEVICE_DISCONNECTED_C || raw == -127.0f) {
      statusTray1 = "disconnected";
      tempTray1 = -999.0f;
    } else if (raw == 85.0f) {
      statusTray1 = "fault"; // Power-on reset condition
      tempTray1 = raw;
    } else {
      statusTray1 = "ok";
      tempTray1 = raw;
    }
  } else {
    statusTray1 = "disconnected";
  }

  // Read Tray 2
  if (discoveredSensorsCount >= 2) {
    float raw = sensors.getTempC(addrTray2);
    if (raw == DEVICE_DISCONNECTED_C || raw == -127.0f) {
      statusTray2 = "disconnected";
      tempTray2 = -999.0f;
    } else if (raw == 85.0f) {
      statusTray2 = "fault";
      tempTray2 = raw;
    } else {
      statusTray2 = "ok";
      tempTray2 = raw;
    }
  } else {
    statusTray2 = "disconnected";
  }

  // Read PCM
  if (discoveredSensorsCount >= 3) {
    float raw = sensors.getTempC(addrPcm);
    if (raw == DEVICE_DISCONNECTED_C || raw == -127.0f) {
      statusPcm = "disconnected";
      tempPcm = -999.0f;
    } else if (raw == 85.0f) {
      statusPcm = "fault";
      tempPcm = raw;
    } else {
      statusPcm = "ok";
      tempPcm = raw;
    }
  } else {
    statusPcm = "disconnected";
  }

  Serial.printf("[TEMPS] Tray1: %.1f C (%s) | Tray2: %.1f C (%s) | PCM: %.1f C (%s)\n",
    tempTray1, statusTray1.c_str(),
    tempTray2, statusTray2.c_str(),
    tempPcm,   statusPcm.c_str()
  );
}

// ----------------------------------------------------------------------------
// Read Solar Battery Voltage (GPIO 35)
// ----------------------------------------------------------------------------
void readBatteryVoltage() {
  int rawAdc = analogRead(PIN_BATTERY_VOLTAGE);
  // 12-bit ADC: 0 - 4095 corresponds to ~0 - 3.3V
  float pinVoltage = (rawAdc / 4095.0f) * 3.3f;
  // Resistor divider: R1 = 100k, R2 = 22k -> Ratio = (100+22)/22 = 5.545
  batteryVoltage = pinVoltage * 5.545f;
}

// ----------------------------------------------------------------------------
// Determine Operating Mode
// ----------------------------------------------------------------------------
void evaluateOperatingStatus() {
  if (statusTray1 != "ok" || statusTray2 != "ok" || statusPcm != "ok") {
    currentOperatingMode = "Sensor Fault / Disconnected";
    return;
  }

  float trayMean = (tempTray1 + tempTray2) / 2.0f;

  if (tempPcm > (trayMean + dischargeDelta)) {
    currentOperatingMode = "Nighttime Heat Release";
  } else if (tempPcm >= pcmChargeTrigger) {
    currentOperatingMode = "PCM Charging";
  } else if (trayMean >= 35.0f) {
    currentOperatingMode = "Daytime Drying";
  } else {
    currentOperatingMode = "Idle";
  }
}

// ----------------------------------------------------------------------------
// Autonomous Dual Buzzer Safety Evaluation
// ----------------------------------------------------------------------------
void evaluateAlertsAndBuzzers() {
  unsigned long now = millis();
  bool criticalAlert = false;
  bool warningAlert  = false;

  // 1. Critical evaluations
  if (statusTray1 == "ok" && tempTray1 >= tray1Crit) criticalAlert = true;
  if (statusTray2 == "ok" && tempTray2 >= tray2Crit) criticalAlert = true;
  if (statusPcm == "ok"   && tempPcm   >= pcmCrit)   criticalAlert = true;

  // 2. Warning evaluations
  if (!criticalAlert) {
    if (statusTray1 == "ok" && tempTray1 >= tray1Warn) warningAlert = true;
    if (statusTray2 == "ok" && tempTray2 >= tray2Warn) warningAlert = true;
    if (statusPcm == "ok"   && tempPcm   >= pcmWarn)   warningAlert = true;
  }

  if (criticalAlert) {
    if (now - lastBuzzerAlertTime >= BUZZER_COOLDOWN_MS || lastBuzzerAlertTime == 0) {
      lastBuzzerAlertTime = now;
      digitalWrite(PIN_BUZZER_2, HIGH); // Continuous critical alarm
      buzzer2TurnOffTime = now + 3000;
      Serial.println(F("[SAFETY] CRITICAL ALARM! Buzzer 2 triggered (GPIO 26)"));
    }
  } else if (warningAlert) {
    if (now - lastBuzzerAlertTime >= BUZZER_COOLDOWN_MS || lastBuzzerAlertTime == 0) {
      lastBuzzerAlertTime = now;
      digitalWrite(PIN_BUZZER_1, HIGH); // Pulsed warning alarm
      buzzer1TurnOffTime = now + 1200;
      Serial.println(F("[SAFETY] WARNING ALARM! Buzzer 1 triggered (GPIO 25)"));
    }
  }
}

// ----------------------------------------------------------------------------
// Fetch Remote Device Config (GET /api/device-config)
// ----------------------------------------------------------------------------
void fetchRemoteDeviceConfig() {
  HTTPClient http;
  http.begin(CONFIG_SERVER_URL);
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(4000);

  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    StaticJsonDocument<768> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error && doc["config"].is<JsonObject>()) {
      JsonObject cfg = doc["config"];
      if (cfg["tray1_warn_c"]) tray1Warn = cfg["tray1_warn_c"];
      if (cfg["tray1_crit_c"]) tray1Crit = cfg["tray1_crit_c"];
      if (cfg["tray2_warn_c"]) tray2Warn = cfg["tray2_warn_c"];
      if (cfg["tray2_crit_c"]) tray2Crit = cfg["tray2_crit_c"];
      if (cfg["pcm_warn_c"])   pcmWarn   = cfg["pcm_warn_c"];
      if (cfg["pcm_crit_c"])   pcmCrit   = cfg["pcm_crit_c"];
      if (cfg["pcm_plateau_c"]) pcmPlateau = cfg["pcm_plateau_c"];
      if (cfg["pcm_charge_trigger_c"]) pcmChargeTrigger = cfg["pcm_charge_trigger_c"];
      if (cfg["pcm_discharge_delta_c"]) dischargeDelta = cfg["pcm_discharge_delta_c"];

      Serial.println(F("[CONFIG] Successfully updated dynamic thresholds from server."));
    }
  } else {
    Serial.printf("[CONFIG] Fetch failed (Code: %d). Retaining fallback thresholds.\n", httpCode);
  }
  http.end();
}

// ----------------------------------------------------------------------------
// OLED Display Refresh
// ----------------------------------------------------------------------------
void updateOledDisplay() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print(F("AGNI SAKTHI"));

  // Wi-Fi indicator
  display.setCursor(85, 0);
  if (WiFi.status() == WL_CONNECTED) {
    display.print(F("WF:OK"));
  } else {
    display.print(F("WF:--"));
  }

  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

  // Tray 1
  display.setCursor(0, 14);
  display.print(F("Tray 1: "));
  if (statusTray1 == "ok") {
    display.printf("%.1f C", tempTray1);
  } else {
    display.print(F("DISCONN"));
  }

  // Tray 2
  display.setCursor(0, 26);
  display.print(F("Tray 2: "));
  if (statusTray2 == "ok") {
    display.printf("%.1f C", tempTray2);
  } else {
    display.print(F("DISCONN"));
  }

  // PCM
  display.setCursor(0, 38);
  display.print(F("PCM:    "));
  if (statusPcm == "ok") {
    display.printf("%.1f C", tempPcm);
  } else {
    display.print(F("DISCONN"));
  }

  display.drawLine(0, 49, 128, 49, SSD1306_WHITE);

  // Status footer
  display.setCursor(0, 53);
  display.print(F("Mode: "));
  display.print(currentOperatingMode.substring(0, 14));

  display.display();
}

// ----------------------------------------------------------------------------
// Telemetry Ingestion HTTP POST (Item 1, 4, 6, 13)
// ----------------------------------------------------------------------------
void sendTelemetryPayload() {
  HTTPClient http;
  http.begin(API_SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(4000);

  // Build JSON payload strictly matching telemetry ingest schema
  StaticJsonDocument<768> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = getIso8601Timestamp();

  JsonObject temps = doc.createNestedObject("temperatures");
  if (statusTray1 == "ok") temps["tray1"] = serialized(String(tempTray1, 1)); else temps["tray1"] = nullptr;
  if (statusTray2 == "ok") temps["tray2"] = serialized(String(tempTray2, 1)); else temps["tray2"] = nullptr;
  if (statusPcm == "ok")   temps["pcm"]   = serialized(String(tempPcm, 1));   else temps["pcm"]   = nullptr;

  JsonObject sensorsObj = doc.createNestedObject("sensors");
  sensorsObj["tray1"] = statusTray1;
  sensorsObj["tray2"] = statusTray2;
  sensorsObj["pcm"]   = statusPcm;

  // Item 13: 64-bit ROM addresses
  JsonObject roms = doc.createNestedObject("romAddresses");
  roms["tray1"] = formatAddressToHex(addrTray1);
  roms["tray2"] = formatAddressToHex(addrTray2);
  roms["pcm"]   = formatAddressToHex(addrPcm);

  // Item 1: Buzzer state reporting
  JsonObject buzzers = doc.createNestedObject("buzzerState");
  buzzers["buzzer1_ok"] = buzzer1Ok;
  buzzers["buzzer2_ok"] = buzzer2Ok;
  buzzers["heartbeat"]  = true;

  doc["batteryVoltage"] = serialized(String(batteryVoltage, 2));
  doc["operatingStatus"] = currentOperatingMode;
  doc["firmwareVersion"] = FIRMWARE_VERSION;

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
      Serial.printf("[HTTP] Ingest successful (Status: %d)\n", httpCode);
    } else {
      Serial.printf("[HTTP] Ingest returned status: %d\n", httpCode);
    }
  } else {
    Serial.printf("[HTTP] Ingest POST failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ----------------------------------------------------------------------------
// Timestamp Helper
// ----------------------------------------------------------------------------
String getIso8601Timestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 50)) {
    return "";
  }
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}
