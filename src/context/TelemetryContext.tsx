"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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
  setDemoMode: (enabled: boolean) => void;
  updateAlertRules: (rules: AlertRule[]) => void;
  updatePcmConfig: (config: PcmCalibrationConfig) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAllActiveAlerts: () => void;
  ingestReading: (reading: TelemetryReading) => void;
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

  const value: TelemetryContextValue = {
    ...storeState,
    setDemoMode: (enabled) => store.setDemoMode(enabled),
    updateAlertRules: (rules) => store.updateAlertRules(rules),
    updatePcmConfig: (config) => store.updatePcmConfig(config),
    acknowledgeAlert: (id) => store.acknowledgeAlert(id),
    clearAllActiveAlerts: () => store.clearAllActiveAlerts(),
    ingestReading: (reading) => store.ingestReading(reading),
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
