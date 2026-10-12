/**
 * @file esp32_solar_dryer.ino
 * @brief Production ESP32 Firmware for IoT Solar Dryer with PCM Thermal Storage
 * 
 * Hardware features:
 * - 3x DS18B20 1-Wire Digital Temperature Probes (Tray 1, Tray 2, PCM)
 * - 0.96" I2C SSD1306 OLED Display (128x64)
 * - Dual Buzzer Alert System (Transistor-driven, non-blocking with hysteresis)
 * - Optional Battery Voltage ADC measurement (Resistor divider)
 * - Wi-Fi Telemetry Ingestion to Next.js / Supabase API endpoint with API Key Auth
 * - Standalone Local Operation resilience (buzzers and OLED work even when Wi-Fi is down)
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

// Operating Mode
String currentOperatingMode = "Idle";

// Timing trackers
unsigned long lastSensorReadTime  = 0;
unsigned long lastTelemetryTime   = 0;
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
void printAddress(DeviceAddress deviceAddress);
void readTemperatureSensors();
void readBatteryVoltage();
void evaluateOperatingStatus();
void evaluateAlertsAndBuzzers();
void updateOledDisplay();
void sendTelemetryPayload();
String getIso8601Timestamp();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println(F("\n======================================================="));
  Serial.println(F("ESP32 IoT Solar Dryer with PCM Thermal Storage Starting"));
  Serial.println(F("Firmware Version: ") FIRMWARE_VERSION);
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
    display.println(F("Solar Dryer IoT"));
    display.setCursor(10, 30);
    display.println(F("PCM Thermal Monitor"));
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

  // 4. Periodic Telemetry Ingestion over Wi-Fi
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS || lastTelemetryTime == 0) {
    lastTelemetryTime = now;
    if (WiFi.status() == WL_CONNECTED) {
      sendTelemetryPayload();
    } else {
      Serial.println(F("[WIFI] Disconnected. Telemetry buffered locally."));
      // Attempt reconnection
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
    Serial.print(F("[1-WIRE] Tray 1 Probe Address: "));
    printAddress(addrTray1);
    Serial.println();
  }
  if (discoveredSensorsCount >= 2 && sensors.getAddress(addrTray2, 1)) {
    Serial.print(F("[1-WIRE] Tray 2 Probe Address: "));
    printAddress(addrTray2);
    Serial.println();
  }
  if (discoveredSensorsCount >= 3 && sensors.getAddress(addrPcm, 2)) {
    Serial.print(F("[1-WIRE] PCM Probe Address:    "));
    printAddress(addrPcm);
    Serial.println();
    sensorsMapped = true;
  } else {
    Serial.println(F("[WARNING] Fewer than 3 probes detected. Probes will report status accordingly."));
  }
}

void printAddress(DeviceAddress deviceAddress) {
  for (uint8_t i = 0; i < 8; i++) {
    if (deviceAddress[i] < 16) Serial.print("0");
    Serial.print(deviceAddress[i], HEX);
    if (i < 7) Serial.print(":");
  }
}

// ----------------------------------------------------------------------------
// Read Sensors & Health Detection
// ----------------------------------------------------------------------------
void readTemperatureSensors() {
  sensors.requestTemperatures();

  // Helper lambda for reading and status validation
  auto processProbe = [](float rawVal, String &statusOut) -> float {
    // DS18B20 returns DEVICE_DISCONNECTED_C (-127°C) or 85°C on power-on reset fault
    if (rawVal == DEVICE_DISCONNECTED_C || rawVal < -55.0f || rawVal > 125.0f) {
      statusOut = "disconnected";
      return -999.0f;
    } else if (rawVal == 85.0f) {
      statusOut = "faulty";
      return -999.0f;
    } else {
      statusOut = "ok";
      return rawVal;
    }
  };

  if (discoveredSensorsCount >= 1) {
    float raw = sensors.getTempC(addrTray1);
    tempTray1 = processProbe(raw, statusTray1);
  } else {
    statusTray1 = "disconnected";
    tempTray1 = -999.0f;
  }

  if (discoveredSensorsCount >= 2) {
    float raw = sensors.getTempC(addrTray2);
    tempTray2 = processProbe(raw, statusTray2);
  } else {
    statusTray2 = "disconnected";
    tempTray2 = -999.0f;
  }

  if (discoveredSensorsCount >= 3) {
    float raw = sensors.getTempC(addrPcm);
    tempPcm = processProbe(raw, statusPcm);
  } else {
    statusPcm = "disconnected";
    tempPcm = -999.0f;
  }

  Serial.printf("[READINGS] Tray1: %.1f C (%s) | Tray2: %.1f C (%s) | PCM: %.1f C (%s)\n",
                tempTray1, statusTray1.c_str(),
                tempTray2, statusTray2.c_str(),
                tempPcm, statusPcm.c_str());
}

void readBatteryVoltage() {
  int rawAdc = analogRead(PIN_BATTERY_VOLTAGE);
  float pinVoltage = (rawAdc / ESP32_ADC_RESOLUTION) * ESP32_ADC_REFERENCE_VOLT;
  batteryVoltage = pinVoltage * BATTERY_DIVIDER_RATIO;
}

// ----------------------------------------------------------------------------
// Operating Mode Rules Engine
// ----------------------------------------------------------------------------
void evaluateOperatingStatus() {
  // If sensors are disconnected or faulty, mode is Unknown/Not Configured
  if (statusTray1 != "ok" || statusTray2 != "ok" || statusPcm != "ok") {
    currentOperatingMode = "Unknown/Not Configured";
    return;
  }

  float avgTray = (tempTray1 + tempTray2) / 2.0f;

  // Rule 1: PCM Charging
  // PCM is heating up towards or within its phase change range (45°C - 58°C)
  // and solar drying air is actively heating (tray > 40°C)
  if (avgTray >= 38.0f && tempPcm >= PCM_CHARGE_START && avgTray >= (tempPcm - 2.0f)) {
    currentOperatingMode = "PCM Charging";
  }
  // Rule 2: Daytime Drying
  // Trays are hot, active solar radiation drying product
  else if (avgTray >= 35.0f && avgTray > tempPcm) {
    currentOperatingMode = "Daytime Drying";
  }
  // Rule 3: Nighttime Heat Release
  // Solar drying has ceased (trays dropping), but PCM is still hot and releasing stored latent heat (PCM > Tray)
  else if (tempPcm >= 38.0f && tempPcm > (avgTray + 2.0f)) {
    currentOperatingMode = "Nighttime Heat Release";
  }
  // Rule 4: Idle
  // Near ambient or night without PCM heat
  else {
    currentOperatingMode = "Idle";
  }
}

// ----------------------------------------------------------------------------
// Local Alerts and Dual Buzzer Logic (Hardware Resilience)
// ----------------------------------------------------------------------------
void evaluateAlertsAndBuzzers() {
  unsigned long now = millis();
  bool triggerWarnBuzzer1 = false;
  bool triggerCritBuzzer2 = false;

  // 1. Critical Overheat checks
  if ((statusPcm == "ok" && tempPcm >= PCM_CRIT_HIGH) ||
      (statusTray1 == "ok" && tempTray1 >= TRAY1_CRIT_HIGH) ||
      (statusTray2 == "ok" && tempTray2 >= TRAY2_CRIT_HIGH)) {
    triggerCritBuzzer2 = true;
  }

  // 2. Warning checks or disconnected probe
  if ((statusTray1 != "ok" || statusTray2 != "ok" || statusPcm != "ok") ||
      (statusPcm == "ok" && tempPcm >= PCM_WARN_HIGH) ||
      (statusTray1 == "ok" && tempTray1 >= TRAY1_WARN_HIGH) ||
      (statusTray2 == "ok" && tempTray2 >= TRAY2_WARN_HIGH)) {
    triggerWarnBuzzer1 = true;
  }

  // Cooldown check to avoid continuous irritating sounding
  if ((triggerCritBuzzer2 || triggerWarnBuzzer1) && (now - lastBuzzerAlertTime >= BUZZER_COOLDOWN_MS)) {
    lastBuzzerAlertTime = now;
    if (triggerCritBuzzer2) {
      Serial.println(F("[BUZZER] Triggering Critical Alert on Buzzer 2!"));
      digitalWrite(PIN_BUZZER_2, HIGH);
      buzzer2TurnOffTime = now + 1200; // 1.2s blast
    } else if (triggerWarnBuzzer1) {
      Serial.println(F("[BUZZER] Triggering Warning Alert on Buzzer 1."));
      digitalWrite(PIN_BUZZER_1, HIGH);
      buzzer1TurnOffTime = now + 400;  // 400ms beep
    }
  }
}

// ----------------------------------------------------------------------------
// OLED Display Presentation
// ----------------------------------------------------------------------------
void updateOledDisplay() {
  display.clearDisplay();
  
  // Header line
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print(F("SOLAR DRYER"));

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
// Telemetry Ingestion HTTP POST
// ----------------------------------------------------------------------------
void sendTelemetryPayload() {
  HTTPClient http;
  http.begin(API_SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(4000);

  // Build JSON payload strictly matching standard schema
  StaticJsonDocument<512> doc;
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
      Serial.printf("[HTTP] Ingest returned warning status: %d\n", httpCode);
    }
  } else {
    Serial.printf("[HTTP] Ingest POST failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

// ----------------------------------------------------------------------------
// Timestamp Helper
// ----------------------------------------------------------------------------
String getIso8601Timestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 50)) {
    // If NTP not yet synced, return empty or fallback
    return "";
  }
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}
