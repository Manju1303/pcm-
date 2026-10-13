"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check if an updated worker is waiting
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setUpdateAvailable(true);
          }

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn("[PWA] Service worker registration failed:", err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleRefresh = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 flex items-center space-x-3 text-xs animate-bounce"
    >
      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
      <div>
        <p className="font-semibold">Update available</p>
        <p className="text-slate-400 text-[11px]">A newer version of the dashboard is ready.</p>
      </div>
      <button
        onClick={handleRefresh}
        className="ml-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}
