/* ============================================================
   sw.js - 《修仙人生》PWA Service Worker
   离线仙境缓存、资源预载与网络自适应
   ============================================================ */

const CACHE_NAME = 'xiuxian-pwa-v1';
const RUNTIME_CACHE = 'xiuxian-runtime-v1';

// 核心预缓存修真底图与主干资源
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png',

  // 样式表
  '/css/reset.css',
  '/css/theme.css',
  '/css/layout.css',
  '/css/components.css',

  // 仙境核心画卷与立绘
  '/src/assets/images/xianxia_bg_banner_1792114543496.jpg',
  '/src/assets/images/sect_mountain_gate_1792114544883.jpg',
  '/src/assets/images/cave_cultivation_1792114544316.jpg',
  '/src/assets/images/cultivator_avatar_1792114545622.jpg',

  // 基础脚本
  '/js/main.js',
  '/js/core/state.js',
  '/js/core/utils.js',
  '/js/core/modal.js',
  '/js/core/save.js',
  '/js/core/audio.js',
  '/js/ui/render.js',
  '/js/ui/day.js',
  '/js/ui/cave.js',
  '/js/ui/sect.js',
  '/js/ui/battle.js',
  '/js/systems/battle.js',
  '/js/systems/pets.js',
  '/js/systems/cultivate.js',
  '/js/systems/alchemy.js',
  '/js/systems/forge.js'
];

// 安装：预缓存修真资源并立即接管
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 容错预缓存：即便个别可选项未加载也不中断安装流程
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[PWA SW] Precache failed for:', url, err);
          })
        )
      );
    })
  );
});

// 激活：清理陈旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[PWA SW] Clearing old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截与离线策略
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 仅拦截本站 GET 请求
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // 1. 导航请求（主页面）：优先网络，若离线则回退至缓存中的 index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          const cachedReq = await caches.match(req);
          if (cachedReq) return cachedReq;
          return new Response(
            '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>修仙人生 · 离线仙境</title></head><body style="background:#0f1c19;color:#d4a347;font-family:sans-serif;text-align:center;padding:50px 20px;"><h2>修仙人生</h2><p>道友当前离线，请在联网后刷新重试。</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // 2. 静态资源（CSS, JS, 图像, 音频）：Stale-While-Revalidate 策略
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(req, resClone);
            });
          }
          return networkRes;
        })
        .catch(() => {
          // 网络断开且无缓存时静默回退
          return cachedRes;
        });

      return cachedRes || fetchPromise;
    })
  );
});
