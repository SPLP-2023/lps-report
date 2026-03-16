// StrikeR Service Worker
const CACHE_NAME = 'striker-ti-v3.2';
const ASSETS = [
    './',
    './index.html',
    './reports.html',
    './tools.html',
    './ti-report.html',
    './css/styles.css',
    './js/data.js',
    './js/exif.js',
    './js/touch-signature.js',
    './js/ti-report.js',
    './js/ti-pdf-generator.js',
    './js/survey-drawing-script.js',
    './js/pdf-survey-drawing-append.js',
    './manifest.json',
    './assets/Color logo - no background (px reduction).png',
    './assets/SP Bolt 400x400.png',
    './assets/es12.png',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});
