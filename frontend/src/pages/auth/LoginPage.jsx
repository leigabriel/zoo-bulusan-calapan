import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
);

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

// Map OAuth error codes to user-friendly messages
const getErrorMessage = (errorCode) => {
    // Decode the error code in case it was URL-encoded
    const decodedError = decodeURIComponent(errorCode).toLowerCase();
    
    const errorMessages = {
        'google_auth_cancelled': 'Google sign-in was cancelled. Please try again.',
        'access_denied': 'Google sign-in was cancelled. Please try again.',
        'invalid_request': 'Invalid authentication request. Please try again.',
        'invalid_state': 'Authentication session expired. Please try again.',
        'token_exchange_failed': 'Failed to complete authentication. Please try again.',
        'no_id_token': 'Failed to verify your identity. Please try again.',
        'invalid_user_data': 'Could not retrieve your profile. Please try again.',
        'email_linked_different_account': 'This email is already linked to a different account.',
        'account_deactivated': 'Your account has been deactivated. Please contact support.',
        'authentication_failed': 'Authentication failed. Please try again.',
        'configuration_error': 'Service configuration error. Please try again later.'
    };
    
    // Check for exact match first
    if (errorMessages[errorCode]) {
        return errorMessages[errorCode];
    }
    
    // Check for common error patterns in decoded message
    if (decodedError.includes('missing required google oauth')) {
        return 'Google Sign-In is not configured. Please contact support.';
    }
    if (decodedError.includes('invalid token') || decodedError.includes('token signature')) {
        return 'Failed to verify your identity. Please try again.';
    }
    if (decodedError.includes('expired')) {
        return 'Authentication session expired. Please try again.';
    }
    if (decodedError.includes('network') || decodedError.includes('fetch')) {
        return 'Network error. Please check your connection and try again.';
    }
    
    // In development, show the actual error for debugging
    if (import.meta.env.DEV && errorCode !== 'authentication_failed') {
        console.error('OAuth error:', errorCode, decodedError);
    }
    
    return 'An error occurred during sign-in. Please try again.';
};

const PRIVACY_POLICY_CONTENT = `
Last Updated: December 15, 2025

1. INFORMATION WE COLLECT
We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This includes:
- Personal identification information (name, email address, phone number)
- Account credentials (username, password)
- Payment information (processed securely through third-party providers)
- Visit history and ticket purchases

2. HOW WE USE YOUR INFORMATION
We use the information we collect to:
- Process transactions and send related information
- Send promotional communications (with your consent)
- Respond to your comments, questions, and requests
- Monitor and analyze trends, usage, and activities
- Improve our services and develop new features

3. INFORMATION SHARING
We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
- With service providers who assist in our operations
- To comply with legal obligations
- To protect our rights and safety

4. DATA SECURITY
We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

5. YOUR RIGHTS
You have the right to:
- Access your personal information
- Correct inaccurate data
- Request deletion of your data
- Opt-out of marketing communications

6. COOKIES
We use cookies and similar technologies to enhance your experience and gather information about visitors and visits to our website.

7. CONTACT US
If you have questions about this Privacy Policy, please contact us at:
Email: privacy@zoobulusan.com
Address: Zoo Bulusan, Sorsogon, Philippines
`;

const TERMS_OF_SERVICE_CONTENT = `
Last Updated: December 15, 2025

1. ACCEPTANCE OF TERMS
By accessing and using Zoo Bulusan's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

2. USE OF SERVICES
You agree to use our services only for lawful purposes and in accordance with these Terms. You are responsible for:
- Maintaining the confidentiality of your account
- All activities that occur under your account
- Ensuring your account information is accurate

3. TICKET PURCHASES
- All ticket sales are final unless otherwise stated
- Tickets are non-transferable
- Valid identification may be required for entry
- Children must be accompanied by adults

4. VISITOR CONDUCT
While visiting Zoo Bulusan, you agree to:
- Follow all posted rules and staff instructions
- Respect all animals and their habitats
- Not feed animals unless authorized
- Not litter or damage property
- Supervise children at all times

5. INTELLECTUAL PROPERTY
All content on our website and services, including text, graphics, logos, and images, is the property of Zoo Bulusan and is protected by copyright laws.

6. LIMITATION OF LIABILITY
Zoo Bulusan shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services.

7. MODIFICATIONS
We reserve the right to modify these Terms at any time. Continued use of our services after changes constitutes acceptance of the new Terms.

8. GOVERNING LAW
These Terms shall be governed by the laws of the Republic of the Philippines.

9. CONTACT INFORMATION
For questions regarding these Terms, contact us at:
Email: support@zoobulusan.com
Phone: +63 (XXX) XXX-XXXX
`;

const PolicyModal = ({ isOpen, onClose, title, content }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                    <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        aria-label="Close modal"
                    >
                        <CloseIcon />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">
                        {content}
                    </div>
                </div>
                <div className="p-4 sm:p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoginPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Check for success message from navigation state
        if (location.state?.message) {
            setMessage({ text: location.state.message, type: 'success' });
        }
        
        // Check for OAuth error in URL params
        const errorParam = searchParams.get('error');
        if (errorParam) {
            const errorMessage = getErrorMessage(errorParam);
            // In development, show the raw error code for debugging
            const debugInfo = import.meta.env.DEV ? ` (Code: ${decodeURIComponent(errorParam)})` : '';
            setMessage({ text: errorMessage + debugInfo, type: 'error' });
            // Clean up URL
            window.history.replaceState(null, '', '/login');
        }
    }, [location, searchParams]);

    const handleGoogleSignIn = () => {
        setGoogleLoading(true);
        setMessage({ text: '', type: '' });
        
        // Redirect to backend Google OAuth endpoint
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        window.location.href = `${backendUrl}/auth/google`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await authAPI.login({ 
                identifier, 
                password, 
                loginType: 'user' 
            });

            if (response.success) {
                login(response.user, response.token);

                if (response.user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else if (['staff', 'vet'].includes(response.user.role)) {
                    navigate('/staff/dashboard');
                } else {
                    navigate('/');
                }
            } else {
                setMessage({ text: response.message || 'Login failed', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: err.message || 'An error occurred during login', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative isolate bg-green-950 flex justify-center items-center min-h-screen px-4 py-6 sm:py-8">
            <div
                aria-hidden="true"
                className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            >
                <div
                    style={{
                        clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                    className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#4ade80] to-[#22d3ee] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                />
            </div>

            <PolicyModal
                isOpen={showPrivacyModal}
                onClose={() => setShowPrivacyModal(false)}
                title="Privacy Policy"
                content={PRIVACY_POLICY_CONTENT}
            />

            <PolicyModal
                isOpen={showTermsModal}
                onClose={() => setShowTermsModal(false)}
                title="Terms of Service"
                content={TERMS_OF_SERVICE_CONTENT}
            />

            <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-200">
                <div className="relative flex flex-col justify-between text-white p-6 sm:p-10 md:w-1/2 rounded-2xl md:rounded-none overflow-hidden min-h-[200px] sm:min-h-[300px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-700 to-green-900"></div>
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1534567153574-2b12153a87f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                            alt="Wildlife background"
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-green-900/90 via-green-800/70 to-green-700/60"></div>
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <p className="text-base sm:text-lg opacity-80 font-semibold mb-2">
                                ZOO BULUSAN
                            </p>
                            <h1 className="text-2xl sm:text-4xl font-extrabold leading-snug">
                                Experience Wildlife Up Close
                            </h1>
                        </div>
                        <div className="mt-6 sm:mt-10 opacity-80 text-sm">
                            <p className="mb-2 font-medium">Sorsogon&apos;s Premier Wildlife Sanctuary</p>
                            <div className="flex flex-wrap gap-2 opacity-90 text-xs">
                                <span className="bg-white/10 px-2 py-1 rounded">Wildlife</span>
                                <span className="bg-white/10 px-2 py-1 rounded">Conservation</span>
                                <span className="bg-white/10 px-2 py-1 rounded">Education</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/2 w-full p-6 sm:p-8 flex flex-col justify-center">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">
                        Welcome Back
                    </h1>
                    <p className="text-gray-500 text-sm mb-6">
                        Please log in to your account to continue.
                    </p>

                    {message.text && (
                        <div className={`p-3 mb-4 rounded-lg border flex items-center gap-3 ${
                            message.type === 'success' 
                                ? 'bg-green-50 text-green-800 border-green-200' 
                                : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                            <span className="flex-shrink-0">
                                {message.type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
                            </span>
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                                Email or Username
                            </label>
                            <input
                                type="text"
                                id="identifier"
                                value={identifier}
                                onChange={(e) => setIdentifier(sanitizeInput(e.target.value))}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
                                placeholder="Enter email or username"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition pr-10"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 hover:text-green-700 focus:outline-none"
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                                />
                                <span className="text-gray-600">Remember me</span>
                            </label>
                            <Link to="#" className="text-green-600 hover:underline font-medium">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || googleLoading}
                            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Log in'}
                        </button>

                        {/* Divider */}
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">or</span>
                            </div>
                        </div>

                        {/* Google Sign-In Button */}
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading || googleLoading}
                            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-2.5 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                        >
                            {googleLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-600"></div>
                                    <span>Connecting...</span>
                                </>
                            ) : (
                                <>
                                    <GoogleIcon />
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>

                        <div className="text-center text-sm mt-2">
                            Don&apos;t have an account?{' '}
                            <Link to="/signup" className="text-green-600 hover:underline font-medium">
                                Register
                            </Link>
                        </div>

                        <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                            By logging in, you agree to our{' '}
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(true)}
                                className="text-green-600 hover:underline font-medium"
                            >
                                Terms of Service
                            </button>
                            {' '}and{' '}
                            <button
                                type="button"
                                onClick={() => setShowPrivacyModal(true)}
                                className="text-green-600 hover:underline font-medium"
                            >
                                Privacy Policy
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            >
                <div
                    style={{
                        clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                    className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#4ade80] to-[#22d3ee] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[50.1875rem]"
                />
            </div>
        </div>
    );
};

export default LoginPage;