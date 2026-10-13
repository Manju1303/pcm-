import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TelemetryProvider } from "@/context/TelemetryContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { TopCriticalBanner } from "@/components/layout/TopCriticalBanner";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: {
    template: "%s | Solar Dryer IoT",
    default: "Solar Dryer IoT | PCM Thermal Storage Monitor",
  },
  description:
    "Monitoring dashboard and installable PWA for an ESP32 solar dryer with PCM thermal storage",
  manifest: "/manifest.webmanifest",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192x192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Solar Dryer" />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white pb-16 md:pb-0">
        <TelemetryProvider>
          <ServiceWorkerRegister />
          <TopCriticalBanner />
          <Header />
          <div className="flex-1 flex max-w-7xl w-full mx-auto">
            <Sidebar />
            <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
              {children}
            </main>
          </div>
          <BottomTabBar />
          <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            IoT-Based Solar Dryer with Phase Change Material (PCM) Thermal Storage • ESP32 Controller
          </footer>
        </TelemetryProvider>
      </body>
    </html>
  );
}
