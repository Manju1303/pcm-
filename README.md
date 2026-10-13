# IoT-Based Solar Dryer with PCM Thermal Energy Storage & Temperature Monitoring

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-emerald?logo=pwa)](https://web.dev/progressive-web-apps/)
[![ESP32 Arduino](https://img.shields.io/badge/ESP32-Arduino%20%2F%20PlatformIO-red?logo=espressif)](https://www.espressif.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20RLS-3ecf8e?logo=supabase)](https://supabase.com/)

Monitoring dashboard and installable Progressive Web App (PWA) for an ESP32 solar dryer with Phase Change Material (PCM) thermal storage, deployed at [https://pcm-six.vercel.app](https://pcm-six.vercel.app).

---

## 🔒 Security Notice: Key Rotation Required
> [!WARNING]
> **Action Required:** If you deployed previously with the default college development key, immediately rotate `DEVICE_API_KEY` in your Vercel Project Settings and re-flash your ESP32 microcontroller with the updated secret. The old key has been removed from all codebases.

---

## 📊 Status Today: Implemented vs. Planned

This dashboard represents an engineering college project. In accordance with academic honesty, unverified claims have been replaced with honest progress indicators and project targets:

| Feature / Subsystem | Status Today | Details & Notes |
| :--- | :--- | :--- |
| **PWA Dashboard & App Shell** | **Implemented (Done)** | Next.js 15, standalone PWA, responsive sidebar/bottom tabs, dark mode, offline cache fallback, Recharts analytics. |
| **Security & Authentication** | **Implemented (Done)** | Constant-time `x-api-key` validation (`DEVICE_API_KEY`), server-only httpOnly admin session (`ADMIN_PASSCODE`), 5-attempt/15-min IP rate limiting. |
| **Fault & Stale Detection** | **Implemented (Done)** | Automatic detection of -127°C (disconnect), 85.0°C (power-on reset), flatline, out-of-range, and 2× send interval offline timeout. |
| **Supabase Database & RLS** | **Implemented (Done)** | PostgreSQL migrations in `supabase/migrations/` with public read-only RLS and service-role writes. |
| **ESP32 Firmware Sketch** | **Implemented (Done)** | Firmware in `firmware/esp32_solar_dryer/` with 64-bit ROM reporting, dynamic config fetch, buzzer status reporting, and autonomous offline fallbacks. |
| **1-Wire Temperature Probes** | **Assumed / Unconfirmed** | Probes are assumed to be digital Dallas DS18B20. If probes are analog thermistors or thermocouples, wiring and firmware must change. |
| **Hardware Wiring & Bench Flash** | **In Progress** | Proposed pin map (GPIO 16, 21, 22, 25, 26). Physical bench assembly and first flash upload are pending. |
| **Solar Battery Power System** | **Planned (Not Purchased)** | 12V bike battery, solar charge controller, fuse, and LM2596 DC-DC step-down buck converter have **NOT been purchased yet**. Feature flag remains disabled. |
| **5-Hour Night Heat Release** | **Project Target** | The 5-hour nocturnal duration is a theoretical target ($m \cdot \Delta H_{fus} = 2.5\text{ kg} \times 190\text{ kJ/kg} = 475\text{ kJ} \approx 0.13\text{ kWh}$). Real release duration will be measured and recorded in the Night Test Results section once live thermal runs begin. |
| **GSM / SIM800L Module** | **Optional / Not Installed** | Module is disabled by default; requires dedicated 3.7V-4.4V 2A power rail. |
| **Chamber Moisture Sensor** | **Optional / Not Installed** | Capacitive probe on GPIO 34 is disabled by default. Soil moisture sensors do not directly measure produce water activity unless calibrated. |

---

## ☀️ System Overview & Thermodynamics

The dryer dehydrates agricultural produce across **two trays** (Tray 1 - Upper Deck, Tray 2 - Lower Deck) using solar-heated convective air during daytime hours, while simultaneously charging an integrated **PCM Thermal Core** (Paraffin Wax RT-50, nominal melting range 45–51°C, latent heat of fusion $\Delta H_{fus} = 190 \text{ kJ/kg}$, mass 2.5 kg).

```
                  ┌────────────────────────────────────────────────────────┐
                  │              SOLAR DRYER SYSTEM OVERVIEW               │
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
 Morning to Sunset                   35°C to 58°C                       Plateau 45–51°C
        │                                   │                                   │
        └───────────────────────────────────┼───────────────────────────────────┘
                                            ▼
                  ┌────────────────────────────────────────────────────────┐
                  │         NOCTURNAL HEAT DISCHARGE TARGET (~5 HOURS)     │
                  │   PCM solidifies, releasing latent heat back into     │
                  │   Trays 1 & 2 to prolong dehydration past dusk.        │
                  │   (Target under validation with live test logs)        │
                  └────────────────────────────────────────────────────────┘
```

### Thermodynamic Realities & Scientific Rigor
Temperature probes alone cannot measure exact state of charge ($Q$) or guarantee runtime. Phase transition occurs isothermally: a reading of 50.0°C cannot distinguish 10% molten from 95% molten paraffin. Accurate runtime calculations require:
- PCM Type & Latent Heat of Fusion ($\Delta H_{fus}$, kJ/kg)
- Measured Mass ($m$, kg)
- Phase-Change Transition Temperature ($T_m$, °C)
- Chamber Thermal Loss Coefficient ($U A$, W/K)
- Airflow Mass Flow Rate & Produce Moisture Load

The PCM page includes a calibrated thermal calculator that locks estimates until physical parameters are entered.

---

## 🔌 Hardware Architecture & GPIO Pinout

All hardware pin assignments are centralized in `firmware/esp32_solar_dryer/pins_config.h`.

| Pin | Functional Label | Connected Component | Circuit Guidelines & Safety Warnings |
| :--- | :--- | :--- | :--- |
| **GPIO 16** | `PIN_ONE_WIRE_BUS` | 3x DS18B20 (assumed - confirm) | **Shared 1-Wire Bus**. Requires **4.7 kΩ pull-up to 3.3V**. Power probes with 3.3V. |
| **GPIO 21** | `PIN_I2C_SDA` | SSD1306 OLED (SDA) | Hardware I2C Data line (128x64 display). |
| **GPIO 22** | `PIN_I2C_SCL` | SSD1306 OLED (SCL) | Hardware I2C Clock line. |
| **GPIO 25** | `PIN_BUZZER_1` | Buzzer 1 (Warning Alarm) | **NPN Transistor Driver (2N2222)** with 1 kΩ base resistor. Local fail-safe. |
| **GPIO 26** | `PIN_BUZZER_2` | Buzzer 2 (Critical Overheat) | **NPN Transistor Driver** with 1N4148 flyback diode across buzzer coil. |
| **GPIO 34** | `PIN_ANALOG_MOISTURE` | Optional Moisture Sensor | ADC1_CH6 (Input only). Disabled by default. |
| **GPIO 35** | `PIN_BATTERY_VOLTAGE` | Solar Battery Divider | ADC1_CH7 (Input only). Requires R1=100kΩ / R2=22kΩ divider. Not purchased yet. |
| **GPIO 17** | `PIN_GSM_TX` | SIM800L RX (UART2 TX) | Optional module. Disabled by default. |
| **GPIO 4** | `PIN_GSM_RX` | SIM800L TX (UART2 RX) | Optional module. Disabled by default. |

---

## 📡 REST API Specifications

### 1. Ingest Telemetry (`POST /api/telemetry`)
- **Headers:** `Content-Type: application/json`, `x-api-key: [DEVICE_API_KEY]`
- **Authentication:** Constant-time verification using SHA-256 fixed-length buffers against server `DEVICE_API_KEY` (returns 401 on mismatch).
- **Validation:** Zod schema validation (-40 to 125°C, -127 and 85 sentinels accepted as faults, 0-20V battery; returns 400 on bad frame).

```json
{
  "deviceId": "solar-dryer-01",
  "timestamp": "2026-10-13T10:30:00Z",
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
  "romAddresses": {
    "tray1": "28FF641E831704AD",
    "tray2": "28FF641E831704AE",
    "pcm": "28FF641E831704AF"
  },
  "buzzerState": {
    "buzzer1_ok": true,
    "buzzer2_ok": true,
    "heartbeat": true
  },
  "batteryVoltage": 12.65,
  "operatingStatus": "PCM Charging"
}
```

### 2. Device Config Fetch (`GET /api/device-config`)
- **Headers:** `x-api-key: [DEVICE_API_KEY]`
- **Response:** JSON thresholds (`tray1_warn_c`, `tray1_crit_c`, `pcm_warn_c`, etc.) so the ESP32 synchronizes remote settings while maintaining offline fallbacks.

---

## 🗄️ Database & Supabase Schema Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run the SQL migration located at `supabase/migrations/20261013000000_solar_dryer_schema.sql` via the Supabase SQL Editor.
3. The migration establishes:
   - `devices`: Registered microcontroller nodes and connection state.
   - `device_configs`: Remote alarm thresholds, PCM parameters, and feature flags.
   - `sensor_readings`: Ingested time-series telemetry data.
   - `sensor_faults`: Hardware diagnostic fault logs (-127°C, 85.0°C reset, flat-lines).
   - `alert_rules`: Real-time monitoring thresholds with hysteresis and cooldown.
   - `alert_events`: Incident audit log with acknowledgment tracking.
   - `project_status`: Admin-editable 6-phase college roadmap milestones.
   - `night_tests`: Nocturnal thermal discharge experimental run records.
   - **Row Level Security (RLS)**: Public read-only queries with server-only `service_role` writes.

---

## 🧪 Automated Testing
Run the integrated test suite:
```bash
npm test
```
Validates constant-time API-key rejection, Zod telemetry schema bounds, sensor fault detection (-127, 85, flat-line), disconnection detection at 2× send interval, and threshold mapping.

---

## 🚀 Getting Started

1. **Clone repository and install dependencies:**
   ```bash
   git clone https://github.com/Manju1303/pcm-.git
   cd pcm-
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and define `DEVICE_API_KEY`, `ADMIN_PASSCODE`, `SESSION_SECRET`, and Supabase credentials.

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

4. **Build production bundle:**
   ```bash
   npm run build
   ```
