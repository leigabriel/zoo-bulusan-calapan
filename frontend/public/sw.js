const CACHE_VERSION = 'bulusan-static-v1';
const STATIC_CACHE = CACHE_VERSION;
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/zusan-ai.svg',
    '/animal-scan.svg',
    '/bz-url-logo.png',
    '/deer.png',
    '/profile-img/default-avatar.svg',
    '/images/animal.webp',
    '/images/event-img-placeholder.jpg',
    '/background/1000.webp',
    '/background/1001.webp',
    '/background/1002.gif',
    '/background/1003.webp',
    '/mistral/mistral.TTF'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(async cache => {
            await Promise.allSettled(STATIC_ASSETS.map(asset => cache.add(asset)));
            await self.skipWaiting();
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== STATIC_CACHE).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

const isCacheableResponse = response => response.ok || response.type === 'opaque';

const cacheFirst = request => caches.match(request).then(cached => {
    if (cached) return cached;

    return fetch(request).then(response => {
        if (isCacheableResponse(response)) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, copy));
        }
        return response;
    });
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const isNavigation = request.mode === 'navigate';
    const isImage = request.destination === 'image';
    const isFont = request.destination === 'font';
    const isStylesheet = request.destination === 'style';
    const isLocalModelFile = url.origin === self.location.origin && url.pathname.startsWith('/model/');

    if (isNavigation) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const copy = response.clone();
                    caches.open(STATIC_CACHE).then(cache => cache.put('/index.html', copy));
                    return response;
                })
                .catch(() => caches.match('/index.html'))
        );
        return;
    }

    if (isImage || isFont || isStylesheet || isLocalModelFile) {
        event.respondWith(cacheFirst(request));
    }
});
