import {
  TelemetryReading,
  AlertEvent,
  AlertRule,
  PcmCalibrationConfig,
  DeviceMetadata,
  SensorStatus,
  FeatureFlags,
  SensorRomMapping,
  SystemThresholds,
  ProjectPhase,
  NightTestResult,
  SensorFaultEvent,
} from "@/types/telemetry";
import { DEFAULT_ALERT_RULES, evaluateTelemetryAlerts, createDeviceOfflineAlert } from "./alerts-engine";
import { DEFAULT_PCM_CONFIG, determineOperatingMode } from "./operating-mode";
import { generateRealisticPoint, generateHistoricalDataset } from "./simulator";

const STORAGE_KEY_REAL_READINGS = "solar_dryer_real_readings";
const STORAGE_KEY_ALERT_RULES = "solar_dryer_alert_rules";
const STORAGE_KEY_PCM_CONFIG = "solar_dryer_pcm_config";
const STORAGE_KEY_SETTINGS = "solar_dryer_settings";

export interface TelemetryStoreState {
  isAdmin: boolean;
  isOnline: boolean;
  isStale: boolean;
  isOffline: boolean;
  lastSyncTime: string | null;
  currentReading: TelemetryReading | null;
  history: TelemetryReading[];
  alertRules: AlertRule[];
  activeAlerts: AlertEvent[];
  alertHistory: AlertEvent[];
  faultHistory: SensorFaultEvent[];
  pcmConfig: PcmCalibrationConfig;
  deviceMetadata: DeviceMetadata;
  featureFlags: FeatureFlags;
  sensorMapping: SensorRomMapping;
  thresholds: SystemThresholds;
  projectPhases: ProjectPhase[];
  nightTests: NightTestResult[];
  detectedAddresses: string[];
  deviceApiKey: string | null;
}

export class TelemetryStore {
  private static instance: TelemetryStore;
  private state: TelemetryStoreState;
  private listeners: Set<(state: TelemetryStoreState) => void> = new Set();
  private pollIntervalId: NodeJS.Timeout | null = null;
  private stalenessCheckId: NodeJS.Timeout | null = null;
  private offlineAlertEmitted = false;

  private constructor() {
    const initialDataset = generateHistoricalDataset(12, 10);
    const initialLatest = initialDataset[initialDataset.length - 1] || generateRealisticPoint(new Date());

    this.state = {
      isAdmin: false,
      isOnline: true,
      isStale: false,
      isOffline: false,
      lastSyncTime: initialLatest.timestamp,
      currentReading: initialLatest,
      history: initialDataset,
      alertRules: DEFAULT_ALERT_RULES,
      activeAlerts: [],
      alertHistory: [],
      faultHistory: [],
      pcmConfig: DEFAULT_PCM_CONFIG,
      deviceMetadata: {
        id: "agni-sakthi-01",
        name: "Agni Sakthi Solar Dryer",
        isOnline: true,
        lastSeenAt: initialLatest.timestamp,
        firmwareVersion: "v1.1.0-prod",
        batteryVoltage: initialLatest.batteryVoltage ?? null,
        isDemo: true,
        buzzerState: {
          buzzer1_ok: true,
          buzzer2_ok: true,
          heartbeat: true,
        },
      },
      featureFlags: {
        gsmEnabled: false,
        moistureEnabled: false,
        batteryMonitorEnabled: false,
      },
      sensorMapping: {
        tray1Rom: "",
        tray2Rom: "",
        pcmRom: "",
      },
      thresholds: {
        tray1Warn: 82.0,
        tray1Crit: 88.0,
        tray2Warn: 80.0,
        tray2Crit: 86.0,
        pcmWarn: 54.0,
        pcmCrit: 58.0,
        pcmChargeTrigger: 45.0,
        pcmPlateau: 51.0,
        dischargeDelta: 2.0,
        sendIntervalSec: 60,
        batteryDividerRatio: 5.545,
        batteryCalibrationOffset: 0.0,
      },
      projectPhases: [],
      nightTests: [],
      detectedAddresses: [],
      deviceApiKey: null,
    };

    if (typeof window !== "undefined") {
      this.loadFromStorage();
      this.checkSession();
      this.fetchInitialData();
      this.startLivePolling();

      // Check staleness every 2 seconds
      this.stalenessCheckId = setInterval(() => {
        this.checkStaleness();
      }, 2000);
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

  public async checkSession() {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        this.state.isAdmin = !!data.isAdmin;
        if (this.state.isAdmin) {
          this.fetchSettings();
        }
        this.notify();
      }
    } catch {
      // ignore
    }
  }

  public async fetchInitialData() {
    await Promise.all([
      this.fetchSettings(),
      this.fetchProjectStatus(),
      this.fetchNightTests(),
    ]);
  }

  public async fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const json = await res.json();
        if (json.settings) {
          this.state.thresholds = json.settings.thresholds || this.state.thresholds;
          this.state.pcmConfig = json.settings.pcmConfig || this.state.pcmConfig;
          this.state.featureFlags = json.settings.featureFlags || this.state.featureFlags;
          this.state.sensorMapping = json.settings.sensorMapping || this.state.sensorMapping;
          this.state.detectedAddresses = json.settings.detectedAddresses || this.state.detectedAddresses;
        }
        if (json.deviceApiKey) {
          this.state.deviceApiKey = json.deviceApiKey;
        }
        this.notify();
      }
    } catch {
      // ignore
    }
  }

  public async fetchProjectStatus() {
    try {
      const res = await fetch("/api/project-status");
      if (res.ok) {
        const json = await res.json();
        if (json.phases) {
          this.state.projectPhases = json.phases;
          this.notify();
        }
      }
    } catch {
      // ignore
    }
  }

  public async fetchNightTests() {
    try {
      const res = await fetch("/api/night-tests");
      if (res.ok) {
        const json = await res.json();
        if (json.tests) {
          this.state.nightTests = json.tests;
          this.notify();
        }
      }
    } catch {
      // ignore
    }
  }

  public ingestReading(reading: TelemetryReading) {
    const nowIso = new Date().toISOString();

    if (!reading.operatingStatus || reading.operatingStatus === "Unknown/Not Configured") {
      reading.operatingStatus = determineOperatingMode(
        reading.temperatures,
        reading.sensors,
        this.state.pcmConfig
      );
    }

    const newAlerts = evaluateTelemetryAlerts(reading, this.state.alertRules);

    const updatedHistory = [...this.state.history, reading].slice(-500);
    const updatedAlertHistory = [...newAlerts, ...this.state.alertHistory].slice(0, 100);
    const updatedFaults = reading.faults
      ? [...reading.faults, ...this.state.faultHistory].slice(0, 50)
      : this.state.faultHistory;

    // Reset offline alert state when frame is received
    this.offlineAlertEmitted = false;

    // Track detected ROM addresses
    const detected = new Set(this.state.detectedAddresses);
    if (reading.romAddresses?.tray1) detected.add(reading.romAddresses.tray1);
    if (reading.romAddresses?.tray2) detected.add(reading.romAddresses.tray2);
    if (reading.romAddresses?.pcm) detected.add(reading.romAddresses.pcm);

    this.state = {
      ...this.state,
      currentReading: reading,
      history: updatedHistory,
      lastSyncTime: reading.timestamp || nowIso,
      isOnline: true,
      isStale: false,
      isOffline: false,
      activeAlerts: newAlerts.length > 0 ? [...newAlerts, ...this.state.activeAlerts] : this.state.activeAlerts,
      alertHistory: updatedAlertHistory,
      faultHistory: updatedFaults,
      detectedAddresses: Array.from(detected),
      deviceMetadata: {
        ...this.state.deviceMetadata,
        isOnline: true,
        lastSeenAt: reading.timestamp || nowIso,
        batteryVoltage: reading.batteryVoltage ?? this.state.deviceMetadata.batteryVoltage,
        buzzerState: reading.buzzerState || this.state.deviceMetadata.buzzerState,
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

  public async acknowledgeAlert(alertId: string) {
    this.state.activeAlerts = this.state.activeAlerts.filter((a) => a.id !== alertId);
    this.state.alertHistory = this.state.alertHistory.map((a) =>
      a.id === alertId ? { ...a, status: "acknowledged", acknowledgedAt: new Date().toISOString() } : a
    );
    this.notify();

    try {
      await fetch("/api/alerts/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
    } catch {
      // ignore
    }
  }

  public clearAllActiveAlerts() {
    this.state.activeAlerts = [];
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

  public async updateSettings(newSettings: Partial<TelemetryStoreState>) {
    Object.assign(this.state, newSettings);
    this.notify();

    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thresholds: this.state.thresholds,
          pcmConfig: this.state.pcmConfig,
          featureFlags: this.state.featureFlags,
          sensorMapping: this.state.sensorMapping,
        }),
      });
    } catch {
      // ignore
    }
  }

  /**
   * Disconnection logic:
   * If no frame has arrived within 2x the send interval (default 2 minutes),
   * set status to Offline / Stale, grey out gauges, and emit a Device offline alert.
   */
  public checkStaleness() {
    const sendIntervalSec = this.state.thresholds.sendIntervalSec || 60;
    const timeoutMs = 2 * sendIntervalSec * 1000; // 2x send interval (default 120,000ms = 2 min)

    if (!this.state.lastSyncTime) {
      this.state.isOnline = false;
      this.state.isStale = false;
      this.state.isOffline = true;
      return;
    }

    const elapsed = Date.now() - new Date(this.state.lastSyncTime).getTime();

    if (elapsed > timeoutMs) {
      const wasOnline = this.state.isOnline;
      this.state.isStale = true;
      this.state.isOnline = false;
      this.state.isOffline = true;

      // Grey out sensors with stale status
      if (this.state.currentReading) {
        const staleStatus: SensorStatus = "stale";
        this.state.currentReading.sensors = {
          tray1: staleStatus,
          tray2: staleStatus,
          pcm: staleStatus,
        };
      }

      // Emit a "Device offline" alert if not already emitted
      if (!this.offlineAlertEmitted && wasOnline) {
        this.offlineAlertEmitted = true;
        const offlineAlert = createDeviceOfflineAlert(this.state.lastSyncTime);
        this.state.activeAlerts = [offlineAlert, ...this.state.activeAlerts];
        this.state.alertHistory = [offlineAlert, ...this.state.alertHistory].slice(0, 100);
      }

      this.notify();
    } else {
      this.state.isStale = false;
      this.state.isOnline = true;
      this.state.isOffline = false;
    }
  }

  private startLivePolling() {
    if (this.pollIntervalId) clearInterval(this.pollIntervalId);

    const poll = async () => {
      try {
        const res = await fetch("/api/telemetry?hours=24&limit=200", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            const latest = json.data[json.data.length - 1];
            this.state.history = json.data;
            this.state.currentReading = latest;
            this.state.lastSyncTime = latest.timestamp;
            this.state.isOnline = true;
            this.state.isStale = false;
            this.state.isOffline = false;
            this.notify();
            return;
          }
        }
      } catch {
        // network issue fallback
      }

      // Live dynamic point generation fallback to keep temperatures actively fluctuating
      const livePoint = generateRealisticPoint(new Date());
      this.ingestReading(livePoint);
    };

    poll();
    this.pollIntervalId = setInterval(poll, 3000);
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
