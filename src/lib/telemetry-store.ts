import {
  TelemetryReading,
  AlertEvent,
  AlertRule,
  PcmCalibrationConfig,
  DeviceMetadata,
  SensorStatus,
} from "@/types/telemetry";
import { DEFAULT_ALERT_RULES, evaluateTelemetryAlerts } from "./alerts-engine";
import { DEFAULT_PCM_CONFIG, determineOperatingMode } from "./operating-mode";

const STORAGE_KEY_REAL_READINGS = "solar_dryer_real_readings";
const STORAGE_KEY_ALERT_RULES = "solar_dryer_alert_rules";
const STORAGE_KEY_PCM_CONFIG = "solar_dryer_pcm_config";

// Threshold in milliseconds after which device data is deemed stale (5 minutes)
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
  private pollIntervalId: NodeJS.Timeout | null = null;

  private constructor() {
    this.state = {
      isDemoMode: false,
      isOnline: false,
      isStale: false,
      lastSyncTime: null,
      currentReading: null,
      history: [],
      alertRules: DEFAULT_ALERT_RULES,
      activeAlerts: [],
      alertHistory: [],
      pcmConfig: DEFAULT_PCM_CONFIG,
      deviceMetadata: {
        id: "solar-dryer-01",
        name: "Solar Dryer Unit #1",
        isOnline: false,
        lastSeenAt: null,
        firmwareVersion: "v1.0.0",
        batteryVoltage: null,
        isDemo: false,
      },
    };

    if (typeof window !== "undefined") {
      this.loadFromStorage();
      this.startLivePolling();
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
    this.notify();
  }

  public ingestReading(reading: TelemetryReading) {
    const nowIso = new Date().toISOString();

    // Re-evaluate mode based on live sensor readings if needed
    if (!reading.operatingStatus || reading.operatingStatus === "Unknown/Not Configured") {
      reading.operatingStatus = determineOperatingMode(
        reading.temperatures,
        reading.sensors,
        this.state.pcmConfig
      );
    }

    // Evaluate alerts
    const newAlerts = evaluateTelemetryAlerts(reading, this.state.alertRules);

    const updatedHistory = [...this.state.history, reading].slice(-500);
    const updatedAlertHistory = [...newAlerts, ...this.state.alertHistory].slice(0, 100);

    this.state = {
      ...this.state,
      currentReading: reading,
      history: updatedHistory,
      lastSyncTime: reading.timestamp || nowIso,
      isOnline: true,
      isStale: false,
      activeAlerts: newAlerts.length > 0 ? [...newAlerts, ...this.state.activeAlerts] : this.state.activeAlerts,
      alertHistory: updatedAlertHistory,
      deviceMetadata: {
        ...this.state.deviceMetadata,
        isOnline: true,
        lastSeenAt: reading.timestamp || nowIso,
        batteryVoltage: reading.batteryVoltage ?? this.state.deviceMetadata.batteryVoltage,
        isDemo: false,
      },
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_REAL_READINGS, JSON.stringify(updatedHistory.slice(-50)));
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

  /**
   * Polls the live backend API for real readings pushed by the ESP32
   */
  private startLivePolling() {
    if (this.pollIntervalId) clearInterval(this.pollIntervalId);

    const poll = async () => {
      try {
        const res = await fetch("/api/telemetry?demo=false&hours=24&limit=100", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            const latest = json.data[json.data.length - 1];
            this.state.history = json.data;
            this.state.currentReading = latest;
            this.state.lastSyncTime = latest.timestamp;
            this.state.isOnline = true;
            this.checkStaleness();
            this.notify();
          } else {
            this.checkStaleness();
          }
        }
      } catch (err) {
        // network or server not reachable yet
        this.checkStaleness();
      }
    };

    // Initial poll
    poll();
    // Poll every 4 seconds for live data
    this.pollIntervalId = setInterval(poll, 4000);
  }

  private checkStaleness() {
    if (!this.state.lastSyncTime) {
      this.state.isOnline = false;
      this.state.isStale = false;
      return;
    }

    const elapsed = Date.now() - new Date(this.state.lastSyncTime).getTime();
    if (elapsed > STALE_TIMEOUT_MS) {
      this.state.isStale = true;
      this.state.isOnline = false;
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

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const pcmStr = localStorage.getItem(STORAGE_KEY_PCM_CONFIG);
      if (pcmStr) {
        this.state.pcmConfig = { ...DEFAULT_PCM_CONFIG, ...JSON.parse(pcmStr) };
      }

      const rulesStr = localStorage.getItem(STORAGE_KEY_ALERT_RULES);
      if (rulesStr) {
        this.state.alertRules = JSON.parse(rulesStr);
      }

      const storedReal = localStorage.getItem(STORAGE_KEY_REAL_READINGS);
      if (storedReal) {
        const parsed = JSON.parse(storedReal) as TelemetryReading[];
        if (parsed.length > 0) {
          const latest = parsed[parsed.length - 1];
          this.state.history = parsed;
          this.state.currentReading = latest;
          this.state.lastSyncTime = latest.timestamp;
          this.checkStaleness();
        }
      }
    } catch (e) {
      console.warn("Failed reading localStorage configuration", e);
    }
  }
}
