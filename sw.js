// Service Worker: שומר את כל הקבצים כדי שהאפליקציה תעבוד בלי אינטרנט.
// כשמשנים קבצים – מעלים את מספר הגרסה כאן.
const VERSION = 'jericho-v5';
const FILES = [
  './', 'index.html', 'manifest.json', 'css/app.css',
  'fonts/rubik-hebrew.woff2', 'fonts/rubik-latin.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'js/main.js', 'js/app.js', 'js/state.js', 'js/audio.js', 'js/db.js', 'js/ui.js', 'js/rewards.js', 'js/content.js', 'js/story.js', 'js/focus.js', 'js/focus-content.js', 'js/parent.js',
  'js/games/common.js', 'js/games/hunter.js', 'js/games/swipe.js', 'js/games/who.js', 'js/games/order.js', 'js/games/boss.js', 'js/games/exam.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match('index.html'))));
});
