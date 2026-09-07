import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCookieConsent, setCookieConsent } from '../utils/consent';

const CookieConsentBanner = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const hasDecision = getCookieConsent();
        if (!hasDecision) {
            setVisible(true);
        }
    }, []);

    const handleDecision = (accepted) => {
        setCookieConsent(accepted);
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[300] bg-[#f2fbf4] border-t-4 border-emerald-600 shadow-2xl"
            role="dialog"
            aria-live="polite"
            aria-label="Cookie consent"
        >
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1f2d23] mb-1">
                        We use cookies to improve your experience
                    </p>
                    <p className="text-xs text-[#1f2d23]/70 leading-relaxed">
                        We use cookies and similar technologies to keep our site secure, understand
                        how you use it, and process payments through PayMongo. You can review how
                        we use cookies in our{' '}
                        <Link
                            to="/cookies"
                            className="text-emerald-700 font-semibold hover:underline"
                        >
                            Cookie Policy
                        </Link>
                        .
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => handleDecision(false)}
                        className="px-5 py-2.5 rounded-lg border border-[#1f2d23]/30 text-sm font-semibold text-[#1f2d23] hover:bg-[#1f2d23]/5 transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDecision(true)}
                        className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
                    >
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsentBanner;