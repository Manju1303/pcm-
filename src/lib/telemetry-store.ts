import {
  TelemetryReading,
  AlertEvent,
  AlertRule,
  PcmCalibrationConfig,
  DeviceMetadata,
  SensorStatus,
} from "@/types/telemetry";
import { generateHistoricalDataset, generateRealisticPoint } from "./simulator";
import { DEFAULT_ALERT_RULES, evaluateTelemetryAlerts } from "./alerts-engine";
import { DEFAULT_PCM_CONFIG, determineOperatingMode } from "./operating-mode";

const STORAGE_KEY_DEMO_MODE = "solar_dryer_demo_mode";
const STORAGE_KEY_REAL_READINGS = "solar_dryer_real_readings";
const STORAGE_KEY_ALERT_RULES = "solar_dryer_alert_rules";
const STORAGE_KEY_ALERT_EVENTS = "solar_dryer_alert_events";
const STORAGE_KEY_PCM_CONFIG = "solar_dryer_pcm_config";

// Threshold in milliseconds after which device data is deemed stale (e.g. 5 minutes)
export const STALE_TIMEOUT_MS = 5 * 60 * 1000;

export interface TelemetryStoreState {
  isDemoMode: boolean;
  isOnline: boolean;
  isStale: boolean;
  lastSyncTime: string | null;
  currentReading: TelemetryReading | null;
  history: TelemetryReading[];
  alertRules: AlertRule[];
  activeAlerts: AlertEvent[];
  alertHistory: AlertEvent[];
  pcmConfig: PcmCalibrationConfig;
  deviceMetadata: DeviceMetadata;
}

export class TelemetryStore {
  private static instance: TelemetryStore;
  private state: TelemetryStoreState;
  private listeners: Set<(state: TelemetryStoreState) => void> = new Set();
  private demoIntervalId: NodeJS.Timeout | null = null;

  private constructor() {
    // Initial state with 24 hours of realistic baseline
    const initialHistory = generateHistoricalDataset(24, 10);
    const latest = initialHistory[initialHistory.length - 1] || null;

    this.state = {
      isDemoMode: true,
      isOnline: true,
      isStale: false,
      lastSyncTime: latest ? latest.timestamp : new Date().toISOString(),
      currentReading: latest,
      history: initialHistory,
      alertRules: DEFAULT_ALERT_RULES,
      activeAlerts: [],
      alertHistory: [],
      pcmConfig: DEFAULT_PCM_CONFIG,
      deviceMetadata: {
        id: "solar-dryer-01",
        name: "Pilot Solar Dryer Unit #1",
        isOnline: true,
        lastSeenAt: latest ? latest.timestamp : new Date().toISOString(),
        firmwareVersion: "v1.0.0-prod",
        batteryVoltage: latest ? (latest.batteryVoltage ?? 12.6) : 12.6,
        isDemo: true,
      },
    };

    if (typeof window !== "undefined") {
      this.loadFromStorage();
      this.startSimulationTick();
    }
  }

  public static getInstance(): TelemetryStore {
    if (!TelemetryStore.instance) {
      TelemetryStore.instance = new TelemetryStore();
    }
    return TelemetryStore.instance;
  }

  public getState(): TelemetryStoreState {
    return this.state;
  }

  public subscribe(listener: (state: TelemetryStoreState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public setDemoMode(enabled: boolean) {
    this.state.isDemoMode = enabled;
    this.state.deviceMetadata.isDemo = enabled;

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_DEMO_MODE, JSON.stringify(enabled));
    }

    if (enabled) {
      if (!this.demoIntervalId) {
        this.startSimulationTick();
      }
    } else {
      // In real device mode, check if we have stored real readings
      this.loadRealReadings();
    }
    this.checkStaleness();
    this.notify();
  }

  public ingestReading(reading: TelemetryReading) {
    // If incoming reading is from real hardware, handle it
    const isStale = false;
    const nowIso = new Date().toISOString();

    // Check operating mode if not already set
    if (!reading.operatingStatus || reading.operatingStatus === "Unknown/Not Configured") {
      reading.operatingStatus = determineOperatingMode(
        reading.temperatures,
        reading.sensors,
        this.state.pcmConfig
      );
    }

    // Evaluate alerts
    const newAlerts = evaluateTelemetryAlerts(reading, this.state.alertRules);

    const updatedHistory = [...this.state.history, reading].slice(-500); // keep last 500 points
    const updatedAlertHistory = [...newAlerts, ...this.state.alertHistory].slice(0, 100);

    this.state = {
      ...this.state,
      currentReading: reading,
      history: updatedHistory,
      lastSyncTime: nowIso,
      isOnline: true,
      isStale: false,
      activeAlerts: newAlerts.length > 0 ? [...newAlerts, ...this.state.activeAlerts] : this.state.activeAlerts,
      alertHistory: updatedAlertHistory,
      deviceMetadata: {
        ...this.state.deviceMetadata,
        isOnline: true,
        lastSeenAt: nowIso,
        batteryVoltage: reading.batteryVoltage ?? this.state.deviceMetadata.batteryVoltage,
        isDemo: reading.isDemo ?? false,
      },
    };

    if (typeof window !== "undefined" && !reading.isDemo) {
      try {
        localStorage.setItem(STORAGE_KEY_REAL_READINGS, JSON.stringify(updatedHistory.slice(-100)));
      } catch (e) {
        console.warn("Could not save to localStorage", e);
      }
    }

    this.notify();
  }

  public updateAlertRules(rules: AlertRule[]) {
    this.state.alertRules = rules;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_ALERT_RULES, JSON.stringify(rules));
    }
    this.notify();
  }

  public updatePcmConfig(config: PcmCalibrationConfig) {
    this.state.pcmConfig = config;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_PCM_CONFIG, JSON.stringify(config));
    }
    // Re-evaluate mode on current reading
    if (this.state.currentReading) {
      this.state.currentReading.operatingStatus = determineOperatingMode(
        this.state.currentReading.temperatures,
        this.state.currentReading.sensors,
        config
      );
    }
    this.notify();
  }

  public acknowledgeAlert(alertId: string) {
    this.state.activeAlerts = this.state.activeAlerts.filter((a) => a.id !== alertId);
    this.state.alertHistory = this.state.alertHistory.map((a) =>
      a.id === alertId ? { ...a, status: "acknowledged" } : a
    );
    this.notify();
  }

  public clearAllActiveAlerts() {
    this.state.activeAlerts = [];
    this.notify();
  }

  private startSimulationTick() {
    if (this.demoIntervalId) clearInterval(this.demoIntervalId);

    this.demoIntervalId = setInterval(() => {
      if (!this.state.isDemoMode) return;

      const newPoint = generateRealisticPoint(new Date());
      this.ingestReading(newPoint);
    }, 4000); // 4-second demo tick for responsive charts
  }

  private checkStaleness() {
    if (this.state.isDemoMode) {
      this.state.isStale = false;
      this.state.isOnline = true;
      return;
    }

    if (!this.state.lastSyncTime) {
      this.state.isOnline = false;
      this.state.isStale = true;
      return;
    }

    const elapsed = Date.now() - new Date(this.state.lastSyncTime).getTime();
    if (elapsed > STALE_TIMEOUT_MS) {
      this.state.isStale = true;
      this.state.isOnline = false;
      // Also update sensor statuses to stale
      if (this.state.currentReading) {
        const staleStatus: SensorStatus = "stale";
        this.state.currentReading.sensors = {
          tray1: staleStatus,
          tray2: staleStatus,
          pcm: staleStatus,
        };
      }
    } else {
      this.state.isStale = false;
      this.state.isOnline = true;
    }
  }

  private loadRealReadings() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REAL_READINGS);
      if (stored) {
        const parsed = JSON.parse(stored) as TelemetryReading[];
        if (parsed.length > 0) {
          const latest = parsed[parsed.length - 1];
          this.state.history = parsed;
          this.state.currentReading = latest;
          this.state.lastSyncTime = latest.timestamp;
          this.checkStaleness();
          return;
        }
      }
    } catch (e) {
      console.warn("Failed loading stored real readings", e);
    }

    // If no real readings exist yet
    this.state.history = [];
    this.state.currentReading = null;
    this.state.lastSyncTime = null;
    this.state.isOnline = false;
    this.state.isStale = true;
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const demoModeStr = localStorage.getItem(STORAGE_KEY_DEMO_MODE);
      if (demoModeStr !== null) {
        const val = JSON.parse(demoModeStr);
        this.state.isDemoMode = val;
        this.state.deviceMetadata.isDemo = val;
      }

      const pcmStr = localStorage.getItem(STORAGE_KEY_PCM_CONFIG);
      if (pcmStr) {
        this.state.pcmConfig = { ...DEFAULT_PCM_CONFIG, ...JSON.parse(pcmStr) };
      }

      const rulesStr = localStorage.getItem(STORAGE_KEY_ALERT_RULES);
      if (rulesStr) {
        this.state.alertRules = JSON.parse(rulesStr);
      }
    } catch (e) {
      console.warn("Failed reading localStorage configuration", e);
    }
  }
}
