import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { onAuthExpired } from '../../services/auth-events';

/**
 * Signs the user out when the API reports that their session is no longer valid.
 *
 * Lives inside the Router (AuthProvider wraps BrowserRouter, so AuthContext
 * itself cannot call useNavigate). This is the only place that both clears the
 * session and performs the redirect.
 *
 * Deliberate detail: an expired session redirects with a reason the login page
 * can explain, instead of silently bouncing the user and leaving them thinking
 * they were logged out by hand.
 */
const SessionExpiryListener = () => {
    const { logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const handled = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthExpired(() => {
            // Several requests can 401 at once (the app polls from eight places).
            // Only the first one acts; the rest are ignored.
            if (handled.current) return;
            handled.current = true;

            logout();

            if (typeof window !== 'undefined') {
                window.setTimeout(() => {
                    navigate('/login', { replace: true, state: { sessionExpired: true } });
                    handled.current = false;
                }, 0);
            }
        });

        return unsubscribe;
    }, [logout, navigate, isAuthenticated]);

    return null;
};

export default SessionExpiryListener;
