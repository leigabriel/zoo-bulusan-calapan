import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useScrollLock from '../../../hooks/use-scroll-lock';

// Shown to guests who try to take part in the community. Kept square and monochrome to
// match the community page's plain white/black treatment.
const SignInModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const confirmRef = useRef(null);
    useScrollLock(isOpen);

    useEffect(() => {
        if (!isOpen) return undefined;

        confirmRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const goToLogin = () => {
        onClose();
        navigate('/login');
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="community-signin-title">
            <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

            <div className="relative w-full max-w-sm rounded-md border border-gray-600 bg-white p-5 shadow-2xl sm:p-8">
                <h2 id="community-signin-title" className="text-xl font-black text-black">Sign in to take part</h2>
                <p className="mt-3 text-sm leading-relaxed text-black/70">
                    You can read everything in the community without an account. To post, comment,
                    like or report, please sign in or create a free account.
                </p>

                <div className="mt-7 flex flex-col gap-3">
                    <button
                        ref={confirmRef}
                        type="button"
                        onClick={goToLogin}
                        className="w-full min-h-11 rounded-md bg-black px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-black/85"
                    >
                        Sign in
                    </button>
                    <button
                        type="button"
                        onClick={goToLogin}
                        className="w-full min-h-11 rounded-md border border-gray-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-black transition-colors hover:bg-black/5"
                    >
                        Create account
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full min-h-11 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-black/50 transition-colors hover:text-black"
                    >
                        Keep browsing
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignInModal;
