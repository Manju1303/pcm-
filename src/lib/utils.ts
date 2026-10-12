import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTemp(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "--.-";
  return val.toFixed(1);
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
