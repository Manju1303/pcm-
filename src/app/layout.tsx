import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TelemetryProvider } from "@/context/TelemetryContext";
import { Header } from "@/components/layout/Header";
import { Navbar } from "@/components/layout/Navbar";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "IoT Solar Dryer with PCM Thermal Storage | Live Dashboard",
  description:
    "Production IoT dashboard and installable PWA for solar dryer with Phase Change Material thermal energy storage, 2 product trays, and temperature monitoring.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Solar Dryer",
  },
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/icon-192x192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192x192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
        <TelemetryProvider>
          <ServiceWorkerRegister />
          <Header />
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-medium">
            IoT-Based Solar Dryer with PCM Thermal Storage • ESP32 Controller
          </footer>
        </TelemetryProvider>
      </body>
    </html>
  );
}
