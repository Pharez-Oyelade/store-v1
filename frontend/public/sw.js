// VENDRA PRODUCTION SERVICE WORKER (OFFLINE-FIRST PWA)
const CACHE_NAME = "vendra-cache-v5";

// Core static assets and app shell entrypoints
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/vendra-logo.svg",
  "/vendra-icon.svg",
  "/storefront.jpg",
];

// Fallback branded HTML page in case no cached page or /offline route exists
const EMBEDDED_OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Offline | Vendra</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; color: #111827; }
    .card { background: #fff; max-width: 420px; width: 100%; border-radius: 20px; padding: 36px 28px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04); border: 1px solid #e5e7eb; text-align: center; }
    .icon { width: 56px; height: 56px; border-radius: 16px; background: #fef3c7; color: #d97706; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 24px; font-weight: bold; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #111827; }
    p { font-size: 13px; color: #4b5563; line-height: 1.5; margin: 0 0 24px; }
    .links { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; text-align: left; }
    .link-item { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1px solid #f3f4f6; text-decoration: none; color: #111827; font-size: 13px; font-weight: 600; transition: all 0.15s; background: #fff; }
    .link-item:hover { border-color: #832729; background: #fdf2f2; }
    .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 12px; border-radius: 12px; background: #832729; color: #fff; font-size: 13px; font-weight: 600; border: none; cursor: pointer; box-sizing: border-box; }
    .btn:hover { background: #6b1f21; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Working Offline</h1>
    <p>Your device is currently disconnected from the internet. Your local changes are saved to this device and will sync automatically when reconnected.</p>
    <div class="links">
      <a class="link-item" href="/dashboard/demands">Bespoke Demands</a>
      <a class="link-item" href="/dashboard/orders">Orders Register</a>
      <a class="link-item" href="/dashboard/products">Products & Inventory</a>
    </div>
    <button class="btn" onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>`;

// Install event - precache individually with allSettled so one failure never blocks others
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing and precaching app shell...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            if (res.ok) {
              await cache.put(url, res);
            }
          } catch (err) {
            console.warn("[ServiceWorker] Failed to precache asset:", url, err);
          }
        }),
      );
    }),
  );
  self.skipWaiting();
});

// Activate event - claim control immediately and delete older cache generations
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating new cache version...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log("[ServiceWorker] Removing obsolete cache:", name);
              return caches.delete(name);
            }
          }),
        );
      })
      .then(() => clients.claim()),
  );
});

// Fetch event - comprehensive caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extension schemas
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // 1. Next.js Static Chunks (_next/static/) -> Cache-First with Stale-While-Revalidate
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(async () => {
            const fallback = await cache.match(request);
            if (fallback) return fallback;
            return new Response("/* Chunk unavailable offline */", {
              status: 503,
              headers: { "Content-Type": "application/javascript" },
            });
          });
      }),
    );
    return;
  }

  // 2. Images, SVGs, and Web Fonts -> Stale-While-Revalidate
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|woff2?|ttf|eot)$/) ||
    url.pathname.startsWith("/_next/image") ||
    url.hostname.includes("cloudinary.com")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      }),
    );
    return;
  }

  // 3. API GET Requests (/api/*) -> Network-First, fallback to cached JSON
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, clone);
              })
              .catch(() => {});
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          if (cached) return cached;

          return new Response(
            JSON.stringify({
              success: false,
              message: "Network connection unavailable. Working offline.",
              isOffline: true,
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            },
          );
        }),
    );
    return;
  }

  // 4. Next.js RSC Prefetches & Page Data (_rsc param or RSC: 1 header)
  const isRSC =
    url.searchParams.has("_rsc") || request.headers.get("RSC") === "1";
  if (isRSC) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone1 = response.clone();
            const clone2 = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, clone1);
                // Also cache canonical URL for resilient offline matching
                cache.put(url.origin + url.pathname + "__rsc__", clone2);
              })
              .catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          if (cached) return cached;

          // Try matching ignoring query params (e.g. ?_rsc=hash)
          const cachedIgnoreSearch = await cache.match(request, {
            ignoreSearch: true,
          });
          if (cachedIgnoreSearch) {
            const contentType =
              cachedIgnoreSearch.headers.get("Content-Type") || "";
            if (contentType.includes("text/x-component")) {
              return cachedIgnoreSearch;
            }
          }

          // Try canonical pathname RSC match
          const cachedByPathname = await cache.match(
            url.origin + url.pathname + "__rsc__",
          );
          if (cachedByPathname) {
            return cachedByPathname;
          }

          // Return 503 so Next.js router gracefully triggers document navigation
          return new Response("RSC offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        }),
    );
    return;
  }

  // 5. Full HTML Navigation Requests (mode === 'navigate') -> Network-First with Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone1 = response.clone();
            const clone2 = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, clone1);
                cache.put(url.pathname, clone2);
              })
              .catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);

          // 1. Try matching exact request
          const cachedRequest = await cache.match(request);
          if (cachedRequest) return cachedRequest;

          // 2. Try matching by pathname (e.g. /dashboard/products/new)
          const cachedPath = await cache.match(url.pathname);
          if (cachedPath) return cachedPath;

          // 3. Try matching dedicated offline route
          const cachedOffline = await cache.match("/offline");
          if (cachedOffline) return cachedOffline;

          // 4. Return beautiful branded embedded fallback
          return new Response(EMBEDDED_OFFLINE_HTML, {
            headers: { "Content-Type": "text/html" },
          });
        }),
    );
    return;
  }

  // 6. All other requests
  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      return cached || new Response("Network unavailable", { status: 503 });
    }),
  );
});
