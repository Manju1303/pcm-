# IoT-Based Solar Dryer with PCM Thermal Energy Storage & Temperature Monitoring

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-emerald?logo=pwa)](https://web.dev/progressive-web-apps/)
[![ESP32 Arduino](https://img.shields.io/badge/ESP32-Arduino%20%2F%20PlatformIO-red?logo=espressif)](https://www.espressif.com/)

A complete, production-grade Web Dashboard, installable Progressive Web App (PWA), REST ingestion API, and ESP32 microcontroller firmware engineered for an **IoT-based Solar Dryer with Phase Change Material (PCM) Thermal Energy Storage**.

---

## ☀️ System Overview & Thermodynamics

The system dehydrates produce across **two product trays** using solar-heated convective air during daytime hours, while simultaneously charging an integrated **Phase Change Material (PCM)** bed (e.g. *Paraffin Wax RT-50*, melting point ~50°C, latent heat of fusion $\Delta H_{fus} = 190 \text{ kJ/kg}$).

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 SOLAR DRYER SYSTEM                      │
                  └────────────────────────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│  SOLAR AIR FLOW  │               │   DRYING DECKS   │               │   PCM THERMAL    │
│  COLLECTOR       │               │  Tray 1 & Tray 2 │               │   STORAGE BED    │
└──────────────────┘               └──────────────────┘               └──────────────────┘
        │                                   │                                   │
        ▼                                   ▼                                   ▼
 [Sunlight Heat]                     [Produce Dry]                      [Latent Melting]
 Morning to Sunset                   35°C to 58°C                       Plateau ~50.0°C
        │                                   │                                   │
        └───────────────────────────────────┼───────────────────────────────────┘
                                            ▼
                  ┌────────────────────────────────────────────────────────┐
                  │         NOCTURNAL HEAT DISCHARGE CYCLE (~5 HOURS)      │
                  │   PCM solidifies, releasing latent heat back into     │
                  │   Trays 1 & 2 to prolong dehydration past dusk.        │
                  └────────────────────────────────────────────────────────┘
```

### Thermodynamic Realities & Scientific Rigor
Temperature probes alone cannot measure exact state of charge ($Q$) or guarantee runtime. Phase transition occurs isothermally: a reading of 50.0°C cannot distinguish 10% molten from 95% molten paraffin. Accurate runtime calculations require:
- PCM Type & Latent Heat of Fusion ($\Delta H_{fus}$, kJ/kg)
- Measured Mass ($m$, kg)
- Phase-Change Transition Temperature ($T_m$, °C)
- Chamber Thermal Loss Coefficient ($U A$, W/K)
- Airflow Mass Flow Rate & Produce Moisture Load

The dashboard includes a calibrated thermal calculator that locks estimates until physical parameters are calibrated.

---

## 🔌 Hardware Architecture & GPIO Pinout

All hardware pin assignments are centralized in `firmware/esp32_solar_dryer/pins_config.h`.

| Pin | Functional Label | Connected Component | Circuit Guidelines & Safety Warnings |
| :--- | :--- | :--- | :--- |
| **GPIO 16** | `PIN_ONE_WIRE_BUS` | 3x DS18B20 Temp Probes | **Shared 1-Wire Bus**. Requires **4.7 kΩ pull-up to 3.3V**. Power probes with 3.3V. |
| **GPIO 21** | `PIN_I2C_SDA` | SSD1306 128x64 OLED | ESP32 Hardware I2C Data line. |
| **GPIO 22** | `PIN_I2C_SCL` | SSD1306 128x64 OLED | ESP32 Hardware I2C Clock line. |
| **GPIO 25** | `PIN_BUZZER_1` | Warning Buzzer (Active 5V) | **SAFETY**: Never drive buzzer directly from GPIO! Use 2N2222 NPN with 1 kΩ base resistor. |
| **GPIO 26** | `PIN_BUZZER_2` | Critical Buzzer (Active 5V) | Transistor driver with flyback diode across inductive buzzer leads. |
| **GPIO 34** | `PIN_ANALOG_MOISTURE`| Chamber Humidity / Soil | ADC1_CH6 (Input only). Range 0 to 3.3 V. |
| **GPIO 35** | `PIN_BATTERY_VOLTAGE`| Solar Battery Divider | **SAFETY CRITICAL**: Never connect 12V directly! Use $R_1 = 100 \text{ k}\Omega$, $R_2 = 22 \text{ k}\Omega$ (14.8V $\rightarrow$ 2.66V). Add 100 nF cap to GND. |
| **GPIO 17** | `PIN_GSM_TX` | SIM800L RX (Optional) | Disabled by default. SIM800L requires separate 3.7V - 4.4V (2A peak) supply. |
| **GPIO 4** | `PIN_GSM_RX` | SIM800L TX (Optional) | UART2 Rx line. |

### Fail-Safe Autonomous Buzzer Design
The ESP32 firmware evaluates local alarm thresholds autonomously in its internal loop. If the Wi-Fi connection is lost or the dashboard is unreachable, **buzzers on GPIO 25 and 26 still sound immediately** upon dangerous conditions.

---

## 🛠️ Software Stack & Key Features

- **Next.js 15 (App Router)** & **React 19** with **TypeScript**
- **Tailwind CSS** with custom dark/light theme, solar green accents, amber thermal indicators, and alert crimson
- **PWA (Progressive Web App)**: Web App Manifest, Service Worker (`public/sw.js`), standalone installation prompt, and offline application shell
- **Interactive Multi-Series Charts**: Recharts line comparison, deck temperature gradients, and thermal advantage margins
- **Date/Time Range Filtering**: 1h, 6h, 12h, 24h, 7d, and custom ISO datetime range
- **Operating Status Engine**: Real-time evaluation of:
  - *Daytime Drying*
  - *PCM Charging*
  - *Nighttime Heat Release*
  - *Idle*
  - *Unknown / Not Configured* (flagged when sensors are disconnected or uncalibrated)
- **Sensor Health Diagnostics**: Valid, Stale, Disconnected, or Faulty readings detection
- **Summary Metrics**: Statistical Min, Max, Avg, and Delta ($\Delta T$)
- **CSV Data Export**: Instant historical telemetry export with UTC and local timestamps
- **Dual-Mode Simulator**: Seamless toggle between realistic thermodynamic simulation and real hardware

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- Arduino IDE 2.x or PlatformIO (for flashing ESP32)

### 2. Dashboard Installation & Setup
```bash
# 1. Clone repository & install dependencies
cd "solar dryer"
npm install

# 2. Configure environment variables
cp .env.example .env.local

# 3. Run development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Flashing the ESP32 Controller
1. Open `firmware/esp32_solar_dryer/esp32_solar_dryer.ino` in **Arduino IDE** (or open the folder in **PlatformIO**).
2. Install required libraries from Library Manager:
   - `OneWire` by Paul Stoffregen
   - `DallasTemperature` by Miles Burton
   - `Adafruit SSD1306` & `Adafruit GFX Library`
   - `ArduinoJson` (v6.x) by Benoit Blanchon
3. Update `config.h`:
   ```cpp
   #define WIFI_SSID        "Your_WiFi_Name"
   #define WIFI_PASSWORD    "Your_WiFi_Password"
   #define API_SERVER_URL   "http://192.168.1.100:3000/api/telemetry"
   #define API_KEY          "sd_secret_key_college_dryer_2026"
   ```
4. Select board **ESP32 Dev Module** and upload. Open Serial Monitor at **115200 baud**.

---

## 📡 REST Telemetry API Specification

### `POST /api/telemetry`
Ingests an authenticated sensor frame from the ESP32.

**Headers:**
```http
Content-Type: application/json
x-api-key: sd_secret_key_college_dryer_2026
```

**Payload Schema:**
```json
{
  "deviceId": "solar-dryer-01",
  "timestamp": "2026-10-12T15:30:00Z",
  "temperatures": {
    "tray1": 46.2,
    "tray2": 43.8,
    "pcm": 51.5
  },
  "sensors": {
    "tray1": "ok",
    "tray2": "ok",
    "pcm": "ok"
  },
  "batteryVoltage": 12.65,
  "operatingStatus": "PCM Charging"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Telemetry ingested successfully",
  "id": "reading-1760283000000-abc12",
  "timestamp": "2026-10-12T15:30:00Z"
}
```

---

## 📋 Hardware Commissioning Checklist

- [ ] **Power Voltage**: Step down 12V solar battery to exactly 5.0V with buck converter before connecting to ESP32 VIN.
- [ ] **Common Ground**: Tie ESP32 GND, buck converter GND, sensor GNDs, and display GND together.
- [ ] **1-Wire Pull-up**: Measure 4.7 kΩ resistance between GPIO 16 and 3.3V while unpowered.
- [ ] **Battery Divider Ratio**: Test junction voltage before inserting into GPIO 35. Never exceed 2.8V at 14.8V max battery charge.
- [ ] **Transistor Drivers**: Ensure 1 kΩ base resistor on GPIO 25 and 26 for buzzers.
- [ ] **Sensor Identification**: Boot ESP32, touch each probe with warm fingers, and note which DS18B20 ROM corresponds to Tray 1, Tray 2, and PCM.

---

## 🧪 Automated Testing
Run the integrated test suite:
```bash
npm test
```
Validates operating status rules, hysteresis, cooldown timers, stale detection, and CSV formatting.
