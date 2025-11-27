import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Ensure each browser tab gets a unique TAB_ID before the app renders.
// This guarantees X-Tab-ID is available for any initial API calls (login, register, etc.).
try {
    const TAB_ID_KEY = 'TAB_ID';
    if (!sessionStorage.getItem(TAB_ID_KEY)) {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        sessionStorage.setItem(TAB_ID_KEY, uuid);
    }
} catch (e) {
    // sessionStorage might be unavailable in some environments; ignore silently.
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);
