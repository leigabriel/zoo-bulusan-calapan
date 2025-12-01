import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api-client';

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

const LoginPage = ({ isAdmin = false }) => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.message) {
            setMessage({ text: location.state.message, type: 'success' });
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await authAPI.login({ 
                identifier, 
                password, 
                loginType: isAdmin ? 'admin' : 'user' 
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
        <div className="relative isolate bg-green-950 flex justify-center items-center min-h-screen">
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

            <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-200 mx-4">
                <div className="relative flex flex-col justify-between text-white p-10 md:w-1/2 rounded-2xl md:rounded-none overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-700 to-green-900 animate-gradient"></div>
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
                            <p className="text-lg opacity-80 font-semibold mb-2">
                                ZOO BULUSAN
                            </p>
                            <h1 className="text-4xl font-extrabold leading-snug">
                                {isAdmin ? 'Admin & Staff Portal' : 'Experience Wildlife Up Close'}
                            </h1>
                        </div>
                        <div className="mt-10 opacity-80 text-sm">
                            <p className="mb-2 font-medium">Sorsogon's Premier Wildlife Sanctuary</p>
                            <div className="flex space-x-4 opacity-90 text-xs">
                                <span className="bg-white/10 px-2 py-1 rounded">Wildlife</span>
                                <span className="bg-white/10 px-2 py-1 rounded">Conservation</span>
                                <span className="bg-white/10 px-2 py-1 rounded">Education</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/2 w-full p-8 flex flex-col justify-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
                        {isAdmin ? 'Staff Login' : 'Welcome Back'}
                    </h1>
                    <p className="text-gray-500 text-sm mb-6">
                        {isAdmin ? 'Access the admin dashboard' : 'Please log in to your account to continue.'}
                    </p>

                    {message.text && (
                        <div className={`p-3 mb-4 rounded-lg border ${
                            message.type === 'success' 
                                ? 'bg-green-100 text-green-700 border-green-300' 
                                : 'bg-red-100 text-red-700 border-red-300'
                        }`}>
                            {message.text}
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
                                onChange={(e) => setIdentifier(e.target.value)}
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
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow-md shadow-green-300/50 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Logging in...' : 'Log in'}
                        </button>

                        {!isAdmin && (
                            <div className="text-center text-sm mt-2">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-green-600 hover:underline font-medium">
                                    Register
                                </Link>
                            </div>
                        )}

                        {isAdmin ? (
                            <div className="text-center text-sm mt-2">
                                <Link to="/login" className="text-green-600 hover:underline font-medium">
                                    Back to User Login
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center text-sm mt-2">
                                <Link to="/admin/login" className="text-gray-500 hover:underline">
                                </Link>
                            </div>
                        )}
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

            <style>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    background-size: 200% 200%;
                    animation: gradient 6s ease infinite;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;