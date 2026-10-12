# ESP32 Solar Dryer with PCM Thermal Storage Firmware

This directory contains the production-grade C++/Arduino firmware for the **IoT Solar Dryer with PCM Thermal Storage**.

## Features
- **1-Wire Multi-drop Bus**: Supports 3x DS18B20 digital temperature sensors on a single GPIO (`GPIO 16`) with automatic device enumeration.
- **Local OLED Display**: Real-time temperature readouts, Wi-Fi connectivity indicator, battery voltage, and operating mode on SSD1306 (I2C: `GPIO 21` SDA, `GPIO 22` SCL).
- **Dual Local Buzzers with Hardware Transistor Drivers**:
  - Buzzer 1 (`GPIO 25`): Warning alarms (e.g. drying temp too high/low).
  - Buzzer 2 (`GPIO 26`): Critical alarms (e.g. PCM overheat, probe disconnected).
  - **Fail-safe design**: Buzzers and alerts execute locally in real-time even when Wi-Fi is disconnected or server is offline!
- **Battery Voltage ADC Monitoring**: Calibrated analog voltage divider on `GPIO 35` (ADC1_CH7) to measure the solar battery charge status.
- **REST Telemetry Ingestion**: Authenticated HTTP POST payload with API key (`x-api-key`) and ISO-8601 UTC timestamps.
- **Optional SIM800L GSM**: UART interface hook for offline SMS alerts.

## Bill of Materials (Electronics)
| Component | Specification | Purpose |
| :--- | :--- | :--- |
| Microcontroller | ESP32-WROOM-32 (30 or 38 pin) | Main controller & Wi-Fi telemetry |
| Temp Sensors (3x) | DS18B20 Waterproof Stainless Steel Probes | Tray 1, Tray 2, and PCM core |
| Pull-up Resistor | 4.7 kΩ 1/4W | 1-Wire Data Bus pull-up to 3.3V |
| Display | 0.96" SSD1306 I2C OLED (128x64) | Local operator dashboard |
| Buzzers (2x) | 5V Active or Passive Buzzers | Warning & Critical local alarm sounders |
| Transistors (2x) | 2N2222 or BC547 NPN | Transistor switch for buzzers (1k base resistor) |
| Voltage Divider | 100 kΩ + 22 kΩ (1% metal film) | 12V Battery step-down for ESP32 ADC |
| Decoupling Caps | 100 nF ceramic + 100 µF electrolytic | Noise filtering on ADC & power rails |
| Solar Charge Controller| 12V 10A PWM or MPPT | Regulates solar panel to 12V battery |
| Buck Converter | 12V to 5V (3A) Step-Down (LM2596 / MP1584)| Powers ESP32 5V/VIN pin safely |

## Pin Configuration Summary (Provisional)
```
ESP32 GPIO 16  --->  1-Wire Data (DS18B20 Probes) [4.7kΩ pull-up to 3.3V]
ESP32 GPIO 21  --->  OLED SDA
ESP32 GPIO 22  --->  OLED SCL
ESP32 GPIO 25  --->  Buzzer 1 (Warning) Driver Base
ESP32 GPIO 26  --->  Buzzer 2 (Critical) Driver Base
ESP32 GPIO 34  --->  Optional Chamber Humidity / Moisture Sensor (Analog)
ESP32 GPIO 35  --->  Battery Voltage Divider Output
ESP32 GPIO 17  --->  SIM800L TX (Optional GSM)
ESP32 GPIO 4   --->  SIM800L RX (Optional GSM)
```

## How to Flash with Arduino IDE
1. Install **Arduino IDE** (v2.x recommended).
2. Add ESP32 board support URL in Preferences:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Install required libraries from Library Manager:
   - `OneWire` by Paul Stoffregen
   - `DallasTemperature` by Miles Burton
   - `Adafruit SSD1306` by Adafruit
   - `Adafruit GFX Library` by Adafruit
   - `ArduinoJson` (v6.x) by Benoit Blanchon
4. Open `esp32_solar_dryer.ino`.
5. Open `config.h` and update:
   - `WIFI_SSID` and `WIFI_PASSWORD`
   - `API_SERVER_URL` (your Next.js host IP or deployed domain)
   - `API_KEY` (must match `API_INGEST_KEY` in dashboard `.env.local`)
6. Select Board **ESP32 Dev Module** and correct COM port.
7. Click **Upload**. Open Serial Monitor at **115200 baud**.

## How to Flash with PlatformIO (VS Code)
1. Install PlatformIO extension in VS Code.
2. Open the `firmware/esp32_solar_dryer` directory.
3. Configure `config.h`.
4. Click **PlatformIO: Build** and **PlatformIO: Upload**.

## DS18B20 Probe ROM Identification
When the ESP32 boots, it automatically scans the 1-Wire bus and outputs the 64-bit hardware address of each detected sensor to the Serial Monitor.
Example Serial output:
```
[1-WIRE] Detected 3 DS18B20 probe(s) on bus GPIO 16
[1-WIRE] Tray 1 Probe Address: 28:FF:64:1E:83:16:03:72
[1-WIRE] Tray 2 Probe Address: 28:AA:32:05:92:21:04:18
[1-WIRE] PCM Probe Address:    28:B4:77:41:88:19:01:95
```
Touch each probe with warm fingers one by one to verify physical positioning (Tray 1 vs Tray 2 vs PCM) before final installation!
