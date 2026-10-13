import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard temperature formatter: one decimal place, or "--" if null/empty
 */
export function formatTemp(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "--";
  return val.toFixed(1);
}

/**
 * Standard temperature with unit: e.g. "48.2°C" or "--"
 */
export function formatTempUnit(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "--";
  return `${val.toFixed(1)}°C`;
}

export function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return "--:--:--";
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "--:--:--";
  }
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "--/--/----";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--/--/----";
  }
}

export function formatExactDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "No synchronization record";
  try {
    const d = new Date(isoString);
    return d.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Formats relative time (e.g. "just now", "45s ago", "2m ago")
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return "Never";
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 5000) return "just now";
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "Unknown";
  }
}
