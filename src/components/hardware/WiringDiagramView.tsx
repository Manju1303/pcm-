"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Cpu,
} from "lucide-react";

interface PinAssignment {
  gpio: string;
  label: string;
  device: string;
  nature: "Provisional" | "Standard" | "Safety Critical" | "Planned / Unverified";
  notes: string;
}

const PIN_ASSIGNMENTS: PinAssignment[] = [
  {
    gpio: "GPIO 16",
    label: "ONE_WIRE_BUS",
    device: "3x DS18B20 (assumed - confirm)",
    nature: "Planned / Unverified",
    notes: "Requires 4.7 kΩ pull-up to 3.3V. All 3 probes share this line. If your probes are not DS18B20, wiring and firmware must change.",
  },
  {
    gpio: "GPIO 21",
    label: "I2C SDA",
    device: "SSD1306 OLED Display (SDA)",
    nature: "Standard",
    notes: "ESP32 hardware I2C data pin. 128x64 display. Keep wires short (<20 cm).",
  },
  {
    gpio: "GPIO 22",
    label: "I2C SCL",
    device: "SSD1306 OLED Display (SCL)",
    nature: "Standard",
    notes: "ESP32 hardware I2C clock pin.",
  },
  {
    gpio: "GPIO 25",
    label: "BUZZER_1_CTRL",
    device: "Buzzer 1 (Warning Alarm)",
    nature: "Safety Critical",
    notes: "Local audible warning. Must drive via NPN transistor (2N2222) with 1 kΩ base resistor. Local fail-safe without Wi-Fi.",
  },
  {
    gpio: "GPIO 26",
    label: "BUZZER_2_CTRL",
    device: "Buzzer 2 (Critical Alarm)",
    nature: "Safety Critical",
    notes: "Critical thermal alarm. Transistor switched with flyback diode across buzzer coil.",
  },
  {
    gpio: "GPIO 34",
    label: "ANALOG_MOISTURE",
    device: "Soil/Chamber Moisture (Optional)",
    nature: "Planned / Unverified",
    notes: "ADC1_CH6 input only. Disabled by default. Note: Soil moisture sensor is not a direct food-moisture measurement unless calibrated.",
  },
  {
    gpio: "GPIO 35",
    label: "BATTERY_DIVIDER",
    device: "Solar Battery Voltage Divider (Optional)",
    nature: "Planned / Unverified",
    notes: "ADC1_CH7. Bike battery, charge controller, fuse & DC-DC converter not purchased yet. Disabled by default. Requires 100k/22k divider.",
  },
  {
    gpio: "GPIO 17",
    label: "GSM_TX",
    device: "SIM800L RX (Optional / Not Installed)",
    nature: "Planned / Unverified",
    notes: "UART2 TX. Optional module not installed. Requires external 3.7V-4.4V 2A regulator.",
  },
  {
    gpio: "GPIO 4",
    label: "GSM_RX",
    device: "SIM800L TX (Optional / Not Installed)",
    nature: "Planned / Unverified",
    notes: "UART2 RX. Disabled by default.",
  },
];

const COMMISSIONING_STEPS = [
  {
    id: 1,
    title: "Sensor Model Confirmation & Inspection",
    desc: "Physically inspect probe markings. Confirm digital DS18B20 1-Wire vs analog NTC thermistor. If not DS18B20, wiring and firmware must change.",
  },
  {
    id: 2,
    title: "1-Wire 4.7 kΩ Pull-up Verification",
    desc: "With system unpowered, measure resistance between GPIO 16 and 3.3V. Must read ~4.7 kΩ. Power probes with 3.3V (do not supply 5V to DS18B20 data line).",
  },
  {
    id: 3,
    title: "Sensor ROM Address Role Mapping",
    desc: "Flash firmware. Open Serial Monitor (115200 baud). Discover 64-bit addresses. Warm one probe in hand to assign Tray 1, Tray 2, and PCM.",
  },
  {
    id: 4,
    title: "Dual-Buzzer Transistor Switch Test",
    desc: "Verify 2N2222 transistor driver circuit and 1 kΩ base resistors. Confirm buzzers beep autonomously on high temperature thresholds without Wi-Fi.",
  },
  {
    id: 5,
    title: "OLED Local Display Commissioning",
    desc: "Connect SSD1306 (SDA 21 / SCL 22). Verify real-time temperatures display locally on startup before Wi-Fi connects.",
  },
  {
    id: 6,
    title: "Power Subsystem Integration (Planned)",
    desc: "When bike battery, charge controller, fuse, and LM2596 buck converter are acquired: set step-down to exactly 5.0V before ESP32 VIN connection.",
  },
];

export function WiringDiagramView() {
  const [activeTab, setActiveTab] = useState<"pinout" | "checklist" | "schematic">("pinout");
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (id: number) => {
    setCheckedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedSteps).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Navigation tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("pinout")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "pinout"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          Proposed GPIO Pinout
        </button>
        <button
          onClick={() => setActiveTab("checklist")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 ${
            activeTab === "checklist"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <span>Commissioning Checklist</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 font-mono border border-slate-200 dark:border-slate-700">
            {completedCount}/{COMMISSIONING_STEPS.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("schematic")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "schematic"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          Circuit Schematics
        </button>
      </div>

      {/* Tab 1: Pinout Table */}
      {activeTab === "pinout" && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              ESP32 Centralized Hardware Pin Assignment
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Source file: <code className="text-emerald-700 dark:text-emerald-400 font-mono">firmware/esp32_solar_dryer/pins_config.h</code>
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Pin</th>
                  <th className="py-2.5 px-3">Variable Label</th>
                  <th className="py-2.5 px-3">Connected Hardware</th>
                  <th className="py-2.5 px-3">Nature</th>
                  <th className="py-2.5 px-3">Electrical Guidelines & Safety</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {PIN_ASSIGNMENTS.map((p) => (
                  <tr key={p.gpio} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-400">{p.gpio}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.label}</td>
                    <td className="py-2.5 px-3 text-slate-900 dark:text-slate-100 font-sans">{p.device}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                          p.nature === "Safety Critical"
                            ? "bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold"
                            : p.nature === "Planned / Unverified"
                            ? "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {p.nature}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-400 text-[11px] max-w-md">
                      {p.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Commissioning Checklist */}
      {activeTab === "checklist" && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Hardware Commissioning Checklist
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Verify each step before conducting drying and PCM thermal experiments.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
              Completed: {completedCount} / {COMMISSIONING_STEPS.length}
            </div>
          </div>

          <div className="space-y-3">
            {COMMISSIONING_STEPS.map((step) => {
              const isChecked = !!checkedSteps[step.id];
              return (
                <div
                  key={step.id}
                  onClick={() => toggleStep(step.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 ${
                    isChecked
                      ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                        {step.id}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{step.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Circuit Schematics */}
      {activeTab === "schematic" && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 font-mono text-xs text-slate-800 dark:text-slate-200 shadow-xs">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 font-sans mb-3">
            Hardware Interconnection Schematics
          </h3>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 overflow-x-auto space-y-6">
            <div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold mb-1">// 1. DS18B20 (assumed - confirm) 1-Wire Digital Bus Circuit (GPIO 16)</div>
              <pre className="text-slate-700 dark:text-slate-300 text-[11px] leading-tight font-mono">
{`   ESP32 3.3V  -----------------+------------+------------+
                                |            |            |
                             [4.7kΩ]         |            |
                                |            |            |
   ESP32 GPIO 16 --------------+---------+--+---------+--+
   (1-Wire Bus)                |         |  |         |  |
                              [DQ]      [VCC]        [DQ]      [VCC]
                            DS18B20 #1 (Tray 1)    DS18B20 #2 (Tray 2)
                              [GND]                  [GND]
                                |                      |
   ESP32 GND   -----------------+----------------------+`}
              </pre>
            </div>

            <div>
              <div className="text-amber-700 dark:text-amber-400 font-bold mb-1">// 2. Transistor Driver Circuit for Dual Buzzers (GPIO 25 / 26)</div>
              <pre className="text-slate-700 dark:text-slate-300 text-[11px] leading-tight font-mono">
{`   +5V Rail -----------------------+
                                   |
                                [Buzzer]  (Active Buzzer 5V)
                                   |
                                   +-------+
                                   |       | (Flyback Diode 1N4148)
                                [Collector]|
                                   |       |
   ESP32 GPIO 25/26 --[ 1 kΩ ]--[Base] NPN (2N2222)
                                   |
                               [Emitter]
                                   |
   GND Rail -----------------------+`}
              </pre>
            </div>

            <div>
              <div className="text-sky-700 dark:text-sky-400 font-bold mb-1">// 3. Planned Solar Battery Divider with ADC Protection (GPIO 35) [Not Yet Purchased]</div>
              <pre className="text-slate-700 dark:text-slate-300 text-[11px] leading-tight font-mono">
{`   Battery + (12V-14.8V) ---[ R1: 100 kΩ ]---+
                                             |
                                             +----------> ESP32 GPIO 35 (ADC1_CH7)
                                             |            (Max 2.66V at 14.8V in)
                                         [ R2: 22 kΩ ]
                                             |    |
                                             |  [ 100 nF Cap ]
                                             |    |
   Battery - (Common GND) -------------------+----+-----> ESP32 GND`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
