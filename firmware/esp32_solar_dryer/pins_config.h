/**
 * @file pins_config.h
 * @brief Centralized Hardware Pin Configuration for ESP32 Solar Dryer with PCM Thermal Storage
 * 
 * ==============================================================================
 * IMPORTANT HARDWARE SAFETY & COMPLIANCE NOTES:
 * 1. DS18B20 1-Wire Data Bus:
 *    - GPIO 16 is provisional. Requires a 4.7 kΩ pull-up resistor connected 
 *      between DATA (GPIO 16) and 3.3 V.
 *    - Power DS18B20 with 3.3 V (or 5 V with logic level shifting; 3.3 V is recommended).
 * 2. I2C OLED Display (SSD1306 128x64):
 *    - ESP32 Default I2C: SDA = GPIO 21, SCL = GPIO 22. Pull-ups usually integrated on breakout board.
 * 3. Dual Alert Buzzers:
 *    - ESP32 GPIO pins supply max ~12 mA per pin safely. Never drive inductive 
 *      or high-current buzzers directly from GPIO.
 *    - Use an NPN transistor (e.g. 2N2222, BC547) or N-channel MOSFET (e.g. 2N7000) 
 *      driver circuit with base resistor (1 kΩ) and flyback diode for electromagnetic buzzers.
 * 4. Battery Voltage Divider (GPIO 35):
 *    - NEVER connect battery voltage directly to ESP32 GPIOs! ESP32 ADC max is 3.3 V 
 *      (recommended max ~2.5 V - 3.0 V with attenuation).
 *    - For 12 V nominal Lead-Acid / Solar Battery (up to 14.8 V charging): 
 *      Use R1 = 100 kΩ, R2 = 22 kΩ (Division ratio ~0.1803, 14.8 V -> ~2.66 V).
 *    - For 1S Li-Ion/LiFePO4 battery (up to 4.2 V):
 *      Use R1 = 100 kΩ, R2 = 100 kΩ (50% divider, 4.2 V -> 2.1 V).
 *    - Add a 100 nF ceramic capacitor across GPIO 35 to GND for ADC noise filtering.
 * 5. Input-Only Pins:
 *    - GPIO 34, 35, 36 (VP), 39 (VN) are input-only on ESP32 without internal pull-ups/pull-downs.
 * 6. SIM800L GSM (Optional):
 *    - Requires independent power supply (3.7 V - 4.4 V, capable of 2 A burst spikes).
 *    - Do NOT power SIM800L directly from ESP32 3.3V or 5V rail.
 * ==============================================================================
 */

#ifndef PINS_CONFIG_H
#define PINS_CONFIG_H

// --- 1-Wire Temperature Sensors (DS18B20) ---
// Shared bus for Tray 1, Tray 2, and PCM probes
#define PIN_ONE_WIRE_BUS          16  // Provisional: GPIO 16 (Requires 4.7k pullup to 3.3V)

// --- I2C OLED Display (SSD1306 0.96" / 1.3") ---
#define PIN_I2C_SDA               21  // ESP32 default I2C Data
#define PIN_I2C_SCL               22  // ESP32 default I2C Clock
#define OLED_I2C_ADDRESS          0x3C
#define SCREEN_WIDTH              128
#define SCREEN_HEIGHT             64

// --- Local Audible Alert Buzzers ---
// Buzzer 1: Warning alert (e.g. Tray temperature high/low)
#define PIN_BUZZER_1              25  // Active high via transistor driver
// Buzzer 2: Critical alert (e.g. PCM overheat, probe disconnected)
#define PIN_BUZZER_2              26  // Active high via transistor driver

// --- Optional Analog Inputs ---
// GPIO 34: Optional Chamber Soil/Moisture or Crop Humidity analog probe
#define PIN_ANALOG_MOISTURE       34  // ADC1_CH6 (Input only)
// GPIO 35: Solar Battery Voltage divider input
#define PIN_BATTERY_VOLTAGE       35  // ADC1_CH7 (Input only, with resistor divider)

// --- Optional SIM800L GSM Module (UART2) ---
#define ENABLE_SIM800L            false // Set true when module is hardware installed
#define PIN_GSM_TX                17    // ESP32 TX -> SIM800L RX (via 3.3V divider if needed)
#define PIN_GSM_RX                4     // ESP32 RX <- SIM800L TX
#define PIN_GSM_RST               5     // Optional hardware reset pin

// --- Battery Divider Calibration Constants ---
// Example: R1 = 100k, R2 = 22k -> Divider factor = (100k + 22k) / 22k = 5.545
#define BATTERY_DIVIDER_RATIO     5.545f
#define ESP32_ADC_REFERENCE_VOLT  3.3f
#define ESP32_ADC_RESOLUTION      4095.0f

#endif // PINS_CONFIG_H
