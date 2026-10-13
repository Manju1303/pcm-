import { TelemetryReading, PeriodSummaryMetrics, TemperatureMetrics } from "@/types/telemetry";

function calculateSingleSensorMetrics(values: number[]): TemperatureMetrics {
  if (values.length === 0) {
    return { min: null, max: null, avg: null, delta: null, count: 0 };
  }

  let min = values[0];
  let max = values[0];
  let sum = 0;

  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }

  const avg = Number((sum / values.length).toFixed(1));
  const delta = Number((values[values.length - 1] - values[0]).toFixed(1));

  return {
    min: Number(min.toFixed(1)),
    max: Number(max.toFixed(1)),
    avg,
    delta,
    count: values.length,
  };
}

export function computePeriodMetrics(readings: TelemetryReading[]): PeriodSummaryMetrics {
  const tray1Vals: number[] = [];
  const tray2Vals: number[] = [];
  const pcmVals: number[] = [];

  for (const r of readings) {
    if (r.temperatures.tray1 !== null && r.sensors.tray1 === "ok") {
      tray1Vals.push(r.temperatures.tray1);
    }
    if (r.temperatures.tray2 !== null && r.sensors.tray2 === "ok") {
      tray2Vals.push(r.temperatures.tray2);
    }
    if (r.temperatures.pcm !== null && r.sensors.pcm === "ok") {
      pcmVals.push(r.temperatures.pcm);
    }
  }

  return {
    tray1: calculateSingleSensorMetrics(tray1Vals),
    tray2: calculateSingleSensorMetrics(tray2Vals),
    pcm: calculateSingleSensorMetrics(pcmVals),
    count: readings.length,
  };
}
