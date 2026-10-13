"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  TelemetryStore,
  TelemetryStoreState,
} from "@/lib/telemetry-store";
import {
  AlertRule,
  PcmCalibrationConfig,
  TelemetryReading,
} from "@/types/telemetry";

interface TelemetryContextValue extends TelemetryStoreState {
  loginAdmin: (passcode: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  updateSettings: (newSettings: Partial<TelemetryStoreState>) => Promise<void>;
  updateAlertRules: (rules: AlertRule[]) => void;
  updatePcmConfig: (config: PcmCalibrationConfig) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAllActiveAlerts: () => void;
  ingestReading: (reading: TelemetryReading) => void;
  refreshAll: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  const [storeState, setStoreState] = useState<TelemetryStoreState>(() =>
    TelemetryStore.getInstance().getState()
  );

  useEffect(() => {
    const store = TelemetryStore.getInstance();
    const unsubscribe = store.subscribe((newState) => {
      setStoreState({ ...newState });
    });
    return unsubscribe;
  }, []);

  const store = TelemetryStore.getInstance();

  const loginAdmin = useCallback(async (passcode: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await store.checkSession();
        return { success: true };
      }
      return { success: false, error: data.error || "Authentication failed" };
    } catch (err) {
      return { success: false, error: "Network error during authentication" };
    }
  }, [store]);

  const logoutAdmin = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      await store.checkSession();
    }
  }, [store]);

  const value: TelemetryContextValue = {
    ...storeState,
    loginAdmin,
    logoutAdmin,
    updateSettings: (settings) => store.updateSettings(settings),
    updateAlertRules: (rules) => store.updateAlertRules(rules),
    updatePcmConfig: (config) => store.updatePcmConfig(config),
    acknowledgeAlert: (id) => store.acknowledgeAlert(id),
    clearAllActiveAlerts: () => store.clearAllActiveAlerts(),
    ingestReading: (reading) => store.ingestReading(reading),
    refreshAll: () => store.fetchInitialData(),
  };

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry(): TelemetryContextValue {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetry must be used within a TelemetryProvider");
  }
  return context;
}
