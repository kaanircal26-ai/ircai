/* TOZRA Service Worker — v12
   - Kurulumda tek bir eksik dosya yüzünden tüm yükleme iptal olmaz.
   - Yalnızca TOZRA önbellekleri temizlenir.
   - API ve kullanıcıya özel yanıtlar önbelleğe alınmaz.
*/
"use strict";

const CACHE_PREFIX = "tozra-";
const CACHE_NAME = "tozra-v12";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/apple-touch-icon.PNG",
  "/voice.js?v=8"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Her dosyayı ayrı dene. Bir ikon/manifest hatası SW kurulumunu
    // tamamen bozmasın; erişilebilen temel dosyalar yine önbelleğe alınsın.
    await Promise.allSettled(
      APP_SHELL.map(async path => {
        const response = await fetch(path, { cache: "reload" });
        if (response.ok) {
          await cache.put(path, response);
        }
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Harici servisleri, Supabase oturum/veri isteklerini ve API çağrılarını
  // hiçbir koşulda Service Worker önbelleğine alma.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Sayfa gezinmelerinde önce güncel sürümü getir; çevrimdışıyken
  // önbellekteki ana sayfaya geri dön.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("/", response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match("/");
        if (cached) return cached;
        return new Response("TOZRA şu anda çevrimdışı. İnternet bağlantını kontrol edip tekrar dene.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })());
    return;
  }

  // Aynı alan adındaki statik dosyalarda önbellek öncelikli yaklaşım.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response && response.ok && response.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return new Response("", { status: 504, statusText: "Gateway Timeout" });
    }
  })());
});
