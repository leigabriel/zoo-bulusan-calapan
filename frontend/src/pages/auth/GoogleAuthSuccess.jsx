import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Google OAuth Success Handler
 * This component processes the authentication data from Google OAuth callback
 * Data is passed via URL fragment (hash) for security - fragments aren't sent to server
 */
const GoogleAuthSuccess = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState(null);

    useEffect(() => {
        const processAuth = () => {
            try {
                // Extract token and user data from URL fragment
                const hash = window.location.hash.substring(1);
                const params = new URLSearchParams(hash);

                const token = params.get('token');
                const userDataEncoded = params.get('user');

                if (!token || !userDataEncoded) {
                    throw new Error('Missing authentication data');
                }

                const userData = JSON.parse(decodeURIComponent(userDataEncoded));

                if (!userData || !userData.id) {
                    throw new Error('Invalid user data');
                }

                // Clear the URL fragment for security
                window.history.replaceState(null, '', window.location.pathname);

                // Store authentication in context
                login(userData, token, 'user');

                // Redirect based on user role
                if (userData.role === 'admin') {
                    navigate('/admin/dashboard', { replace: true });
                } else if (userData.role === 'staff') {
                    navigate('/staff/dashboard', { replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            } catch (err) {
                console.error("Authentication Error:", err);
                setError('Failed to complete authentication. Please try again.');

                // Redirect to login after a delay
                setTimeout(() => {
                    navigate('/login', {
                        replace: true,
                        state: { message: 'Authentication failed. Please try again.' }
                    });
                }, 3000);
            }
        };

        processAuth();
    }, [login, navigate]);

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
        </div>
    );
};

export default GoogleAuthSuccess;