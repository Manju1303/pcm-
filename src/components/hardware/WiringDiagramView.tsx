"use client";

import React, { useState } from "react";
import {
  Cpu,
  AlertTriangle,
  Zap,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Info,
  Radio,
  ExternalLink,
} from "lucide-react";

interface PinAssignment {
  gpio: string;
  label: string;
  device: string;
  wireColor: string;
  nature: "Provisional" | "Standard" | "Safety Critical";
  notes: string;
}

const PIN_ASSIGNMENTS: PinAssignment[] = [
  {
    gpio: "GPIO 16",
    label: "ONE_WIRE_BUS",
    device: "3x DS18B20 Temp Probes",
    wireColor: "Yellow / White (Data)",
    nature: "Provisional",
    notes: "Requires 4.7 kΩ pull-up resistor to 3.3 V. All 3 probes share this line. Verified 1-Wire bus.",
  },
  {
    gpio: "GPIO 21",
    label: "I2C SDA",
    device: "SSD1306 OLED Display (SDA)",
    wireColor: "Blue / Green",
    nature: "Standard",
    notes: "Default ESP32 hardware I2C data pin. Most OLED breakout boards include on-board 4.7kΩ pull-ups.",
  },
  {
    gpio: "GPIO 22",
    label: "I2C SCL",
    device: "SSD1306 OLED Display (SCL)",
    wireColor: "Yellow",
    nature: "Standard",
    notes: "Default ESP32 hardware I2C clock pin. Keep bus wires under 20 cm for high signal integrity.",
  },
  {
    gpio: "GPIO 25",
    label: "BUZZER_1_CTRL",
    device: "Buzzer 1 (Warning Alarm)",
    wireColor: "Orange",
    nature: "Safety Critical",
    notes: "Never connect buzzer directly to GPIO! Use NPN transistor (2N2222) with 1 kΩ base resistor.",
  },
  {
    gpio: "GPIO 26",
    label: "BUZZER_2_CTRL",
    device: "Buzzer 2 (Critical Alarm)",
    wireColor: "Red / Orange",
    nature: "Safety Critical",
    notes: "Drives critical overheat alarm. Transistor switched with flyback diode across buzzer terminals.",
  },
  {
    gpio: "GPIO 34",
    label: "ANALOG_MOISTURE",
    device: "Optional Chamber Soil/Produce Moisture",
    wireColor: "Purple",
    nature: "Provisional",
    notes: "ADC1_CH6. Input only pin without internal pull-ups/pull-downs. Safe analog input range: 0 - 3.3 V.",
  },
  {
    gpio: "GPIO 35",
    label: "BATTERY_DIVIDER",
    device: "Solar Battery Voltage Divider",
    wireColor: "Gray",
    nature: "Safety Critical",
    notes: "ADC1_CH7. NEVER connect 12V directly! Use R1=100kΩ, R2=22kΩ divider (14.8V max -> ~2.66V at GPIO). Add 100nF filter cap.",
  },
  {
    gpio: "GPIO 17 (TX2)",
    label: "GSM_TX",
    device: "SIM800L RX (Optional GSM Module)",
    wireColor: "Brown",
    nature: "Provisional",
    notes: "SIM800L module is disabled by default. Requires independent 3.7V - 4.4V (2A peak) power supply.",
  },
  {
    gpio: "GPIO 4 (RX2)",
    label: "GSM_RX",
    device: "SIM800L TX (Optional GSM Module)",
    wireColor: "White",
    nature: "Provisional",
    notes: "ESP32 UART2 Receive. Keep disabled unless physical GSM module and 2G SIM are verified active.",
  },
];

const COMMISSIONING_STEPS = [
  {
    id: 1,
    title: "Power Supply & Ground Isolation",
    desc: "Verify 12V solar battery feeds step-down buck converter (LM2596) adjusted to exactly 5.0 V before plugging into ESP32 VIN/5V pin. Tie all GNDs together (ESP32, Sensors, OLED, Buzzers, Buck converter).",
  },
  {
    id: 2,
    title: "1-Wire 4.7 kΩ Pull-up Verification",
    desc: "Measure resistance between GPIO 16 and 3.3V with system powered down. It must read ~4.7 kΩ. Powering with 3.3V is mandatory; do NOT pull up to 5V to prevent ESP32 GPIO over-voltage damage.",
  },
  {
    id: 3,
    title: "Sensor ROM Address Mapping",
    desc: "Flash firmware. Open Serial Monitor (115200 baud). Ensure all 3 DS18B20 addresses appear. Warm each sensor by hand individually to identify which physical address corresponds to Tray 1, Tray 2, and PCM.",
  },
  {
    id: 4,
    title: "Battery Divider Voltage Safety Check",
    desc: "Measure voltage at the divider junction before inserting wire into GPIO 35. At full solar battery float voltage (14.4 V), the divider output must not exceed 2.8 V. Direct battery connection will destroy the ESP32.",
  },
  {
    id: 5,
    title: "Transistor-Driven Buzzers Test",
    desc: "Verify buzzer transistor base resistors (1 kΩ) are in place. Confirm buzzers sound cleanly during startup beep without causing ESP32 brownout reset.",
  },
  {
    id: 6,
    title: "Offline Standalone Resilience Test",
    desc: "Turn off Wi-Fi router. Verify the OLED continues updating local readings and local buzzers sound when high temperature thresholds are artificially simulated.",
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
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("pinout")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "pinout"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          GPIO Pinout Configuration Table
        </button>
        <button
          onClick={() => setActiveTab("checklist")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 ${
            activeTab === "checklist"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>Commissioning Checklist</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-emerald-400 font-mono">
            {completedCount}/{COMMISSIONING_STEPS.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("schematic")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "schematic"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-slate-800 text-slate-400 hover:text-slate-200"
          }`}
        >
          ASCII Circuit Schematics
        </button>
      </div>

      {/* Tab 1: Pinout Table */}
      {activeTab === "pinout" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-sm text-slate-200">
              ESP32 Centralized Hardware Pin Assignment
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Source file: <code className="text-emerald-400 font-mono">firmware/esp32_solar_dryer/pins_config.h</code>
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Pin</th>
                  <th className="py-2.5 px-3">Variable Label</th>
                  <th className="py-2.5 px-3">Connected Hardware</th>
                  <th className="py-2.5 px-3">Nature</th>
                  <th className="py-2.5 px-3">Electrical Guidelines & Safety</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {PIN_ASSIGNMENTS.map((p) => (
                  <tr key={p.gpio} className="hover:bg-slate-850/50">
                    <td className="py-2.5 px-3 font-bold text-emerald-400">{p.gpio}</td>
                    <td className="py-2.5 px-3 text-slate-300">{p.label}</td>
                    <td className="py-2.5 px-3 text-slate-200 font-sans">{p.device}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                          p.nature === "Safety Critical"
                            ? "bg-rose-950/70 text-rose-300 border border-rose-800/60"
                            : p.nature === "Provisional"
                            ? "bg-amber-950/70 text-amber-300 border border-amber-800/60"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {p.nature}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px] max-w-md">
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
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-200">
                Pre-Flight Hardware Commissioning Checklist
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Execute each verification step in order before placing the dryer in unattended operation.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400">
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
                      ? "bg-emerald-950/20 border-emerald-800/60 text-emerald-200"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="mt-0.5">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                        {step.id}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{step.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: ASCII Schematics */}
      {activeTab === "schematic" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 font-mono text-xs text-slate-300">
          <h3 className="font-semibold text-sm text-slate-200 font-sans mb-3">
            Hardware Interconnection Schematics
          </h3>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto space-y-6">
            <div>
              <div className="text-emerald-400 font-bold mb-1">// 1. DS18B20 1-Wire Digital Bus Circuit (GPIO 16)</div>
              <pre className="text-slate-400 text-[11px] leading-tight">
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
              <div className="text-amber-400 font-bold mb-1">// 2. Transistor Driver Circuit for Dual Buzzers (GPIO 25 / 26)</div>
              <pre className="text-slate-400 text-[11px] leading-tight">
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
              <div className="text-sky-400 font-bold mb-1">// 3. Battery Voltage Divider with ADC Protection (GPIO 35)</div>
              <pre className="text-slate-400 text-[11px] leading-tight">
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
