/**
 * Service Worker for Solar Dryer IoT Dashboard PWA
 * Provides offline application shell, safe caching, and network resilience.
 */

const CACHE_NAME = "solar-dryer-cache-v2";
const APP_SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
  "/offline",
  "/live",
  "/analytics",
  "/pcm",
  "/alerts",
  "/health",
  "/wiring",
  "/settings",
  "/admin",
  "/icons/icon-192x192.svg",
  "/icons/icon-512x512.svg",
  "/icons/icon-maskable.svg",
];

// Install Event - Pre-cache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_URLS).catch((err) => {
        console.warn("[SW] Some assets could not be pre-cached:", err);
      });
    })
  );
});

// Message Event - Skip waiting when requested by user
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Activate Event - Clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // NEVER cache write requests (POST, PUT, DELETE) or authentication endpoints
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api/auth") ||
    url.pathname === "/api/settings" ||
    url.pathname.startsWith("/api/alerts/acknowledge") ||
    url.pathname.startsWith("/api/buzzer/test")
  ) {
    return;
  }

  // API GET telemetry queries: Network-first with cached fallback
  if (url.pathname.startsWith("/api/telemetry") || url.pathname.startsWith("/api/project-status")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ source: "OFFLINE_CACHE", count: 0, data: [] }), {
            headers: { "Content-Type": "application/json" },
          });
        })
    );
    return;
  }

  // HTML page navigation: Network-first, fallback to /offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match("/offline");
          return offlinePage || (await caches.match("/")) || new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
