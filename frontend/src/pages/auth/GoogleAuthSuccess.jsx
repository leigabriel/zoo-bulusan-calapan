import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GoogleOnboardingFlow from '../../components/auth/GoogleOnboardingFlow';

/**
 * Google OAuth Success Handler
 * This component processes the authentication data from Google OAuth callback
 * Authentication data is retrieved through a one-time HttpOnly-cookie exchange.
 */
const GoogleAuthSuccess = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState(null);
    const [onboardingUser, setOnboardingUser] = useState(null);

    // The Google handoff cookie is single-use: GET /auth/google/session deletes it on the
    // first read. React 19 StrictMode intentionally runs effects twice in development, so
    // without this guard the second run gets a 401, throws, and bounces a visitor who was
    // already signed in back to /login after the "Authentication Error" screen.
    const handoffConsumed = useRef(false);
    const redirectTimerRef = useRef(null);

    const navigateAfterLogin = useCallback((userData) => {
        if (userData.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
        } else if (userData.role === 'staff') {
            navigate('/staff/dashboard', { replace: true });
        } else {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        // The Google handoff cookie is SINGLE-USE: GET /auth/google/session deletes it on
        // the first read. React 19 StrictMode intentionally runs effects twice in dev, so
        // without this guard the second run gets a 401, throws, and bounces a visitor
        // who was already signed in back to /login behind the "Authentication Error" screen.
        //
        // The ref guard alone is deliberate. An unmount/cancel flag is wrong here: StrictMode
        // runs cleanup immediately and then re-runs the effect, so such a flag would latch
        // true and abort the in-flight request that the ref guard already prevents from
        // being duplicated.
        if (handoffConsumed.current) return;
        handoffConsumed.current = true;

        const processAuth = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL ||
                    import.meta.env.VITE_API_URL?.replace('/api', '') ||
                    'http://localhost:5000';
                const response = await fetch(`${backendUrl}/auth/google/session`, { credentials: 'include' });
                const data = await response.json();
                if (!response.ok || !data.success || !data.user || (!data.token && !data.masterKeyRequired)) throw new Error(data.message || 'Missing authentication data');

                if (data.masterKeyRequired) {
                    navigate('/login', { replace: true, state: { masterKeyChallenge: data.challengeToken } });
                    return;
                }

                const token = data.token;
                const userData = data.user;

                if (!userData || !userData.id) {
                    throw new Error('Invalid user data');
                }

                window.history.replaceState(null, '', window.location.pathname);

                // Store authentication in context
                login(userData, token, 'user');

                // New Google visitor: run the one-time onboarding stepper before landing.
                // Staff and admin never reach this — master-key admins already returned
                // above, and the role check covers the rest.
                if (data.isNewGoogleAccount && userData.role === 'user') {
                    setOnboardingUser(userData);
                    return;
                }

                navigateAfterLogin(userData);
            } catch (err) {
                console.error("Authentication Error:", err);
                setError('Failed to complete authentication. Please try again.');

                // Redirect to login after a delay
                redirectTimerRef.current = setTimeout(() => {
                    navigate('/login', {
                        replace: true,
                        state: { message: 'Authentication failed. Please try again.' }
                    });
                }, 3000);
            }
        };

        processAuth();
    }, [login, navigate, navigateAfterLogin]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white p-6">
                <div className="w-full max-w-md text-center">
                    <div className="text-red-500 mb-6 flex justify-center">
                        <svg className="w-16 h-16 sm:w-20 sm:h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-black mb-3">Authentication Error</h2>
                    <p className="text-base text-gray-600 mb-6">{error}</p>
                    <p className="text-sm font-medium text-gray-400 animate-pulse">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6">
            <div className="w-full max-w-md text-center">

                {/* Refined Spinner utilizing your custom color */}
                <div className="relative mx-auto mb-8 w-16 h-16 sm:w-20 sm:h-20">
                    {/* Background track for the spinner (very light gray) */}
                    <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                    {/* Animated spinning tip using the requested hex code */}
                    <div className="absolute inset-0 border-4 border-t-[#c6fe69] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-black mb-3">Completing Sign In</h2>
                <p className="text-base text-gray-600">Please wait while we complete your authentication...</p>
            </div>

            <GoogleOnboardingFlow
                isOpen={Boolean(onboardingUser)}
                user={onboardingUser}
                hasPassword={Boolean(onboardingUser?.hasPassword)}
                onComplete={() => {
                    const finished = onboardingUser;
                    setOnboardingUser(null);
                    if (finished) navigateAfterLogin(finished);
                }}
            />
        </div>
    );
};

export default GoogleAuthSuccess;
