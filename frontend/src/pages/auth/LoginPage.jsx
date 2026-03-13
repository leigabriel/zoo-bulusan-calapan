import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, messageAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';
import AuthSuccessModal from '../../components/common/AuthSuccessModal';
import { notify } from '../../utils/toast';

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const getErrorMessage = (errorCode) => {
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

    if (errorMessages[errorCode]) {
        return errorMessages[errorCode];
    }

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
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Close modal"
                    >
                        <CloseIcon />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line text-sm sm:text-base leading-relaxed">
                        {content}
                    </div>
                </div>
                <div className="p-4 sm:p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 min-h-[44px]"
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
    const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showSuspendedModal, setShowSuspendedModal] = useState(false);
    const [suspensionInfo, setSuspensionInfo] = useState(null);
    const [showAppealModal, setShowAppealModal] = useState(false);
    const [appealMessage, setAppealMessage] = useState('');
    const [appealLoading, setAppealLoading] = useState(false);
    const [appealSent, setAppealSent] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');
    const [resendingVerification, setResendingVerification] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successUserName, setSuccessUserName] = useState('');
    const [pendingRedirect, setPendingRedirect] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (location.state?.message) {
            notify.success(location.state.message);
        }

        // Check for verified parameter from email verification redirect
        const verifiedParam = searchParams.get('verified');
        if (verifiedParam === 'true') {
            notify.success('Email verified successfully. You can now sign in.');
            window.history.replaceState(null, '', '/login');
        }

        const errorParam = searchParams.get('error');
        if (errorParam) {
            const errorMessage = getErrorMessage(errorParam);
            const debugInfo = import.meta.env.DEV ? ` (Code: ${decodeURIComponent(errorParam)})` : '';
            notify.error(errorMessage + debugInfo);
            window.history.replaceState(null, '', '/login');
        }
    }, [location, searchParams]);

    const handleResendVerification = async () => {
        if (!verificationEmail) return;
        
        setResendingVerification(true);
        try {
            const response = await authAPI.resendVerification({ email: verificationEmail });
            if (response.success) {
                notify.success('Verification email sent. Please check your inbox.');
                setVerificationEmail('');
                setShowVerificationPrompt(false);
            } else {
                notify.error(response.message || 'We could not resend the verification email right now.');
            }
        } catch (err) {
            notify.error(err.message || 'We could not resend the verification email right now.');
        } finally {
            setResendingVerification(false);
        }
    };

    const handleGoogleSignIn = () => {
        setGoogleLoading(true);
        setShowVerificationPrompt(false);

        const backendUrl = import.meta.env.VITE_BACKEND_URL ||
            import.meta.env.VITE_API_URL?.replace('/api', '') ||
            'http://localhost:5000';
        window.location.href = `${backendUrl}/auth/google`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setShowVerificationPrompt(false);

        try {
            const response = await authAPI.login({
                identifier,
                password,
                loginType: 'user'
            });

            if (response.success) {
                login(response.user, response.token);
                
                // Set user name for success modal
                const userName = response.user.firstName || response.user.username || 'User';
                setSuccessUserName(userName);

                // Determine redirect path
                let redirectPath = '/';
                if (response.user.role === 'admin') {
                    redirectPath = '/admin/dashboard';
                } else if (response.user.role === 'staff') {
                    redirectPath = '/staff/dashboard';
                }
                
                // Store pending redirect and show success modal
                setPendingRedirect(redirectPath);
                setShowSuccessModal(true);
            } else if (response.suspended) {
                setSuspensionInfo({
                    reason: response.suspensionReason,
                    suspendedAt: response.suspendedAt,
                    userId: response.userId,
                    email: response.email
                });
                setShowSuspendedModal(true);
            } else if (response.requiresVerification) {
                setVerificationEmail(response.email || identifier);
                setShowVerificationPrompt(true);
                notify.warning(response.message || 'Please verify your email before signing in.');
            } else {
                notify.error(response.message || 'We could not sign you in. Please try again.');
            }
        } catch (err) {
            if (err.suspended) {
                setSuspensionInfo({
                    reason: err.suspensionReason,
                    suspendedAt: err.suspendedAt,
                    userId: err.userId,
                    email: err.email
                });
                setShowSuspendedModal(true);
            } else if (err.requiresVerification) {
                setVerificationEmail(err.email || identifier);
                setShowVerificationPrompt(true);
                notify.warning(err.message || 'Please verify your email before signing in.');
            } else {
                notify.error(err.message || 'We could not sign you in. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAppeal = async () => {
        if (!appealMessage.trim()) {
            notify.warning('Please enter your appeal message.');
            return;
        }

        setAppealLoading(true);
        try {
            // Use the public appeal endpoint which doesn't require authentication
            const response = await authAPI.submitPublicAppeal({
                email: suspensionInfo?.email || identifier,
                subject: 'Suspension Appeal',
                content: appealMessage.trim()
            });

            if (response.success) {
                setAppealSent(true);
                setAppealMessage('');
            } else {
                notify.error(response.message || 'We could not submit your appeal right now.');
            }
        } catch (err) {
            notify.error(err.message || 'We could not submit your appeal right now.');
        } finally {
            setAppealLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-white">
            <AuthSuccessModal 
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    if (pendingRedirect) {
                        navigate(pendingRedirect);
                    }
                }}
                type="login"
                userName={successUserName}
                autoCloseDelay={2500}
            />

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

            {showSuspendedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-red-50 rounded-t-xl">
                            <h2 className="text-xl font-bold text-red-800">Account Suspended</h2>
                            <button
                                onClick={() => {
                                    setShowSuspendedModal(false);
                                    setSuspensionInfo(null);
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm sm:text-base">Your account has been suspended</p>
                                    <p className="text-sm text-gray-500">Contact support or submit an appeal</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
                                <p className="text-sm font-medium text-gray-600 mb-1">Reason for suspension:</p>
                                <p className="text-gray-800 text-sm sm:text-base break-words">{suspensionInfo?.reason || 'No reason provided'}</p>
                                {suspensionInfo?.suspendedAt && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Suspended on: {new Date(suspensionInfo.suspendedAt).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setShowSuspendedModal(false);
                                    setShowAppealModal(true);
                                }}
                                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 min-h-[44px] transition-colors"
                            >
                                Submit an Appeal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAppealModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Submit Appeal</h2>
                            <button
                                onClick={() => {
                                    setShowAppealModal(false);
                                    setAppealMessage('');
                                    setAppealSent(false);
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6">
                            {appealSent ? (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Appeal Submitted</h3>
                                    <p className="text-sm sm:text-base text-gray-600 mb-6">Your appeal has been submitted successfully. You will be notified once it has been reviewed.</p>
                                    <button
                                        onClick={() => {
                                            setShowAppealModal(false);
                                            setAppealSent(false);
                                        }}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 min-h-[44px] w-full transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm sm:text-base text-gray-600 mb-4">
                                        Please explain why you believe your suspension should be lifted. Be respectful and provide relevant details.
                                    </p>
                                    <textarea
                                        value={appealMessage}
                                        onChange={(e) => setAppealMessage(e.target.value)}
                                        placeholder="Enter your appeal message..."
                                        rows={5}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm sm:text-base outline-none transition-all"
                                    />
                                    <button
                                        onClick={handleSubmitAppeal}
                                        disabled={appealLoading || !appealMessage.trim()}
                                        className="w-full mt-4 bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed min-h-[44px] transition-colors"
                                    >
                                        {appealLoading ? 'Submitting...' : 'Submit Appeal'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="relative hidden md:flex md:w-1/2 flex-col justify-between p-12 lg:p-16 overflow-hidden bg-emerald-900">
                <img
                    src="https://images.unsplash.com/photo-1522435229388-6f7a422cd95b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    alt="Wildlife background"
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/40 to-transparent"></div>

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3 text-white">
                        <span className="font-bold text-xl tracking-widest uppercase">Zoo Bulusan</span>
                    </div>

                    <div className="mt-auto">
                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-6">
                            Experience<br />
                            Wildlife<br />
                            Up Close.
                        </h1>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 bg-white">
                <div className="w-full max-w-md mx-auto">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                        <span className='text-emerald-600 text-[1.5rem]'>Bulusan Zoo</span> <br />
                        Welcome Back!
                    </h2>
                    <p className="text-gray-500 text-sm lg:text-base mb-10">
                        Log in to start exploring wildlife conservation with ease.
                    </p>

                    {showVerificationPrompt && verificationEmail && (
                        <div className="p-4 mb-6 rounded-lg border flex flex-col gap-3 bg-amber-50 text-amber-800 border-amber-200">
                            <div className="flex items-center gap-3">
                                <span className="flex-shrink-0">
                                    <ErrorIcon />
                                </span>
                                <span className="text-sm font-medium break-words">Please verify your email before signing in.</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleResendVerification}
                                disabled={resendingVerification}
                                className="w-full mt-2 bg-amber-600 text-white py-2.5 rounded-lg font-medium hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                {resendingVerification ? 'Sending...' : 'Resend Verification Email'}
                            </button>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="identifier" className="block text-sm font-semibold text-gray-900 mb-2">
                                Email or Username
                            </label>
                            <input
                                type="text"
                                id="identifier"
                                value={identifier}
                                onChange={(e) => setIdentifier(sanitizeInput(e.target.value))}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                                placeholder="Input your email or username"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition pr-12 text-sm"
                                    placeholder="Input your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-between text-sm py-2">
                            <label className="flex items-center space-x-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-gray-600 font-medium">Remember Me</span>
                            </label>
                            <Link to="#" className="text-gray-500 hover:text-gray-900 transition-colors">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || googleLoading}
                            className="w-full bg-emerald-600 text-white py-3.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-4 bg-white text-gray-400">Or continue with</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading || googleLoading}
                            className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-3.5 px-4 rounded-lg font-medium border border-gray-200 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
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

                        <div className="text-center text-sm mt-8 text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-gray-900 font-bold hover:underline">
                                Sign up here
                            </Link>
                        </div>

                        <div className="text-center text-xs text-gray-400 mt-8 pt-6">
                            By logging in, you agree to our{' '}
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(true)}
                                className="text-gray-500 hover:text-gray-800 transition-colors underline"
                            >
                                Terms of Service
                            </button>
                            {' '}and{' '}
                            <button
                                type="button"
                                onClick={() => setShowPrivacyModal(true)}
                                className="text-gray-500 hover:text-gray-800 transition-colors underline"
                            >
                                Privacy Policy
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
