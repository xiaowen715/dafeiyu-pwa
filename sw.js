/* 大肥鱼桌宠 Service Worker
   策略：页面 HTML 走网络优先（保证更新），jsDelivr CDN 素材走缓存优先（commit 固定，不可变）。
   仅 GET 请求；失败时回退缓存。 */
const CACHE = 'dafeiyu-pwa-v1';
const CDN_PREFIX = 'https://cdn.jsdelivr.net/gh/zhouwu97/ds-pet@';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // jsDelivr CDN 素材：缓存优先（commit 固定，不可变，安全缓存）
  if (url.href.startsWith(CDN_PREFIX)) {
    e.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          return res;
        }).catch(() => caches.match('/dafeiyu-pwa/'));
      })
    );
    return;
  }

  // 同源页面/资源：网络优先，失败回退缓存
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() =>
        caches.match(req).then((m) => m || caches.match('/dafeiyu-pwa/'))
      )
    );
  }
});
