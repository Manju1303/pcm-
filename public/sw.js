/**
 * Service Worker for Solar Dryer IoT Dashboard PWA
 * Provides offline application shell, safe caching, and network resilience.
 */

const CACHE_NAME = "solar-dryer-cache-v1";
const APP_SHELL_URLS = [
  "/",
  "/manifest.json",
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
  self.skipWaiting();
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

// Fetch Event - Network first with cache fallback for navigation, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache API ingestion POST requests or sensitive auth calls
  if (request.method !== "GET" || url.pathname.startsWith("/api/telemetry")) {
    return;
  }

  // Navigation (HTML pages): Network first, falling back to cache
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
          const fallback = await caches.match("/");
          return fallback || new Response("Offline: App shell unavailable.", { status: 503 });
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
