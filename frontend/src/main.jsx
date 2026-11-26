import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'lenis/dist/lenis.css';
import App from './App.jsx';
import { warmUpBackend } from './services/api-client.js';

// Ensure each browser tab gets a unique TAB_ID before the app renders.
// This guarantees X-Tab-ID is available for any initial API calls
try {
    const TAB_ID_KEY = 'TAB_ID';
    if (!sessionStorage.getItem(TAB_ID_KEY)) {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        sessionStorage.setItem(TAB_ID_KEY, uuid);
    }
} catch {
    // Storage can be unavailable in private browsing or restricted contexts.
}

// Retire service workers registered by earlier builds so their caches cannot
// keep serving outdated assets. Safe to remove once returning visitors have
// loaded this version.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(registration => registration.unregister()));

            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName.startsWith('bulusan-static-'))
                        .map(cacheName => caches.delete(cacheName))
                );
            }
        } catch {
            // The app remains usable when service-worker storage is unavailable.
        }
    });
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);

if (window.location.pathname === '/') {
    const WARMUP_KEY = 'backend-warmup-at';
    const WARMUP_TTL = 5 * 60 * 1000;
    let shouldWarmUp = true;

    try {
        const lastWarmup = Number(sessionStorage.getItem(WARMUP_KEY));
        shouldWarmUp = !lastWarmup || Date.now() - lastWarmup > WARMUP_TTL;
        if (shouldWarmUp) sessionStorage.setItem(WARMUP_KEY, String(Date.now()));
    } catch {
        // Storage is optional; the in-flight promise still prevents duplicates.
    }

    if (shouldWarmUp) {
        setTimeout(() => {
            warmUpBackend();
        }, 0);
    }
}
