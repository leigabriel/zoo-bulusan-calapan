import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'bulusan_cookie_consent_v1';

export const getCookieConsent = () => {
    try {
        const raw = localStorage.getItem(CONSENT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const setCookieConsent = (accepted) => {
    const record = {
        decision: accepted ? 'accepted' : 'declined',
        timestamp: new Date().toISOString()
    };
    try {
        localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    } catch {
        // Storage can be unavailable in private browsing or restricted contexts.
    }
    return record;
};

const CookieConsentBanner = () => {
    const [visible, setVisible] = useState(false);
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        const hasDecision = getCookieConsent();
        if (!hasDecision) {
            setVisible(true);
            // Defer so the enter transition actually plays on mount.
            const id = requestAnimationFrame(() => setEntered(true));
            return () => cancelAnimationFrame(id);
        }
    }, []);

    const handleDecision = (accepted) => {
        setCookieConsent(accepted);
        setEntered(false);
        window.setTimeout(() => setVisible(false), 150);
    };

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-live="polite"
            aria-label="Cookie consent"
            className={`fixed z-[300] bottom-4 left-4 right-4 sm:right-auto sm:bottom-6 sm:left-6
                w-auto sm:w-[360px] transition-all duration-200 ease-out
                ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
            <div className="bg-white border border-[#1f2d23]/12 rounded-lg shadow-[0_4px_20px_rgba(15,23,18,0.08)] px-5 py-4">
                <p className="text-[13px] font-semibold text-[#1f2d23] mb-1.5 tracking-tight">
                    Cookie notice
                </p>
                <p className="text-[12.5px] text-[#1f2d23]/65 leading-relaxed mb-4">
                    We use cookies to keep this site secure, understand how it's used, and
                    process payments through PayMongo.{' '}
                    <Link
                        to="/cookies"
                        className="text-emerald-700 underline underline-offset-2 decoration-emerald-700/30 hover:decoration-emerald-700"
                    >
                        Read our policy
                    </Link>
                    .
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleDecision(true)}
                        className="flex-1 px-3.5 py-2 rounded-md bg-[#1f2d23] hover:bg-[#14201a] text-white text-[12.5px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                        Accept
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDecision(false)}
                        className="flex-1 px-3.5 py-2 rounded-md border border-[#1f2d23]/15 text-[#1f2d23]/80 text-[12.5px] font-medium hover:bg-[#1f2d23]/[0.04] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                        Decline
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsentBanner;