"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
} from "lucide-react";

interface PinAssignment {
  gpio: string;
  label: string;
  device: string;
  nature: "Provisional" | "Standard" | "Safety Critical";
  notes: string;
}

const PIN_ASSIGNMENTS: PinAssignment[] = [
  {
    gpio: "GPIO 16",
    label: "ONE_WIRE_BUS",
    device: "3x DS18B20 Temp Probes",
    nature: "Provisional",
    notes: "Requires 4.7 kΩ pull-up resistor to 3.3 V. All 3 probes share this line. 1-Wire bus.",
  },
  {
    gpio: "GPIO 21",
    label: "I2C SDA",
    device: "SSD1306 OLED Display (SDA)",
    nature: "Standard",
    notes: "Default ESP32 hardware I2C data pin.",
  },
  {
    gpio: "GPIO 22",
    label: "I2C SCL",
    device: "SSD1306 OLED Display (SCL)",
    nature: "Standard",
    notes: "Default ESP32 hardware I2C clock pin. Keep bus wires under 20 cm.",
  },
  {
    gpio: "GPIO 25",
    label: "BUZZER_1_CTRL",
    device: "Buzzer 1 (Warning Alarm)",
    nature: "Safety Critical",
    notes: "Never connect buzzer directly to GPIO! Use NPN transistor (2N2222) with 1 kΩ base resistor.",
  },
  {
    gpio: "GPIO 26",
    label: "BUZZER_2_CTRL",
    device: "Buzzer 2 (Critical Alarm)",
    nature: "Safety Critical",
    notes: "Drives critical overheat alarm. Transistor switched with flyback diode across buzzer leads.",
  },
  {
    gpio: "GPIO 34",
    label: "ANALOG_MOISTURE",
    device: "Optional Chamber Moisture Probe",
    nature: "Provisional",
    notes: "ADC1_CH6. Input only pin without internal pull-ups/pull-downs. Safe input range: 0 - 3.3 V.",
  },
  {
    gpio: "GPIO 35",
    label: "BATTERY_DIVIDER",
    device: "Solar Battery Voltage Divider",
    nature: "Safety Critical",
    notes: "ADC1_CH7. NEVER connect 12V directly! Use R1=100kΩ, R2=22kΩ divider (14.8V max -> ~2.66V at GPIO).",
  },
  {
    gpio: "GPIO 17",
    label: "GSM_TX",
    device: "SIM800L RX (Optional)",
    nature: "Provisional",
    notes: "SIM800L module disabled by default. Requires separate 3.7V - 4.4V (2A peak) supply.",
  },
  {
    gpio: "GPIO 4",
    label: "GSM_RX",
    device: "SIM800L TX (Optional)",
    nature: "Provisional",
    notes: "ESP32 UART2 Receive. Keep disabled unless physical module is installed.",
  },
];

const COMMISSIONING_STEPS = [
  {
    id: 1,
    title: "Power Supply & Ground Isolation",
    desc: "Verify 12V solar battery feeds step-down buck converter (LM2596) adjusted to exactly 5.0 V before plugging into ESP32 VIN/5V pin. Tie all GNDs together.",
  },
  {
    id: 2,
    title: "1-Wire 4.7 kΩ Pull-up Verification",
    desc: "Measure resistance between GPIO 16 and 3.3V with system powered down. It must read ~4.7 kΩ. Power with 3.3V only.",
  },
  {
    id: 3,
    title: "Sensor ROM Address Mapping",
    desc: "Flash firmware. Open Serial Monitor (115200 baud). Ensure all 3 DS18B20 addresses appear. Warm each sensor by hand to verify Tray 1, Tray 2, and PCM.",
  },
  {
    id: 4,
    title: "Battery Divider Voltage Safety Check",
    desc: "Measure voltage at divider junction before connecting GPIO 35. At max battery charge (14.4 V), divider output must not exceed 2.8 V.",
  },
  {
    id: 5,
    title: "Transistor-Driven Buzzers Test",
    desc: "Verify buzzer transistor base resistors (1 kΩ) are in place. Confirm buzzers sound cleanly during startup beep without ESP32 brownout.",
  },
  {
    id: 6,
    title: "Offline Standalone Resilience Test",
    desc: "Turn off Wi-Fi router. Verify OLED continues updating local readings and local buzzers sound when high temperature thresholds are breached.",
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
      <div className="flex space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("pinout")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "pinout"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:text-slate-900"
          }`}
        >
          GPIO Pinout Configuration Table
        </button>
        <button
          onClick={() => setActiveTab("checklist")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 ${
            activeTab === "checklist"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>Commissioning Checklist</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-emerald-700 font-mono border border-slate-200">
            {completedCount}/{COMMISSIONING_STEPS.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("schematic")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === "schematic"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:text-slate-900"
          }`}
        >
          Circuit Schematics
        </button>
      </div>

      {/* Tab 1: Pinout Table */}
      {activeTab === "pinout" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="font-semibold text-sm text-slate-900">
              ESP32 Centralized Hardware Pin Assignment
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Source file: <code className="text-emerald-700 font-mono">firmware/esp32_solar_dryer/pins_config.h</code>
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Pin</th>
                  <th className="py-2.5 px-3">Variable Label</th>
                  <th className="py-2.5 px-3">Connected Hardware</th>
                  <th className="py-2.5 px-3">Nature</th>
                  <th className="py-2.5 px-3">Electrical Guidelines & Safety</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {PIN_ASSIGNMENTS.map((p) => (
                  <tr key={p.gpio} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-emerald-700">{p.gpio}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.label}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-sans">{p.device}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                          p.nature === "Safety Critical"
                            ? "bg-rose-50 text-rose-800 border border-rose-200 font-semibold"
                            : p.nature === "Provisional"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.nature}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px] max-w-md">
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
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Pre-Flight Hardware Commissioning Checklist
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Execute each verification step in order before placing the dryer in unattended operation.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-700 font-semibold">
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
                      ? "bg-emerald-50/50 border-emerald-300 text-emerald-900"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                        {step.id}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{step.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Circuit Schematics */}
      {activeTab === "schematic" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 font-mono text-xs text-slate-800 shadow-xs">
          <h3 className="font-semibold text-sm text-slate-900 font-sans mb-3">
            Hardware Interconnection Schematics
          </h3>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 overflow-x-auto space-y-6">
            <div>
              <div className="text-emerald-700 font-bold mb-1">// 1. DS18B20 1-Wire Digital Bus Circuit (GPIO 16)</div>
              <pre className="text-slate-700 text-[11px] leading-tight font-mono">
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
              <div className="text-amber-700 font-bold mb-1">// 2. Transistor Driver Circuit for Dual Buzzers (GPIO 25 / 26)</div>
              <pre className="text-slate-700 text-[11px] leading-tight font-mono">
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
              <div className="text-sky-700 font-bold mb-1">// 3. Battery Voltage Divider with ADC Protection (GPIO 35)</div>
              <pre className="text-slate-700 text-[11px] leading-tight font-mono">
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
