import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api-client';
import { sanitizeInput, sanitizeEmail, sanitizePhone } from '../../utils/sanitize';

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

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="20,6 9,17 4,12"/>
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

// Password validation helper
const validatePassword = (password) => {
    return {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
};

const isPasswordValid = (password) => {
    const validation = validatePassword(password);
    return validation.minLength && validation.hasUppercase && validation.hasNumber && validation.hasSymbol;
};

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        gender: 'prefer_not_to_say',
        birthday: '',
        password: '',
        confirmPassword: '',
        role: 'user'
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [touched, setTouched] = useState({});
    const navigate = useNavigate();

    const passwordValidation = validatePassword(formData.password);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let sanitizedValue = value;
        
        if (name === 'email') {
            sanitizedValue = sanitizeEmail(value);
        } else if (name === 'phoneNumber') {
            sanitizedValue = sanitizePhone(value);
        } else if (name !== 'password' && name !== 'confirmPassword') {
            sanitizedValue = sanitizeInput(value);
        }
        
        setFormData({ ...formData, [name]: sanitizedValue });
        if (errors.length > 0) {
            setErrors([]);
        }
    };

    const handleBlur = (e) => {
        setTouched({ ...touched, [e.target.name]: true });
    };

    const validateForm = () => {
        const validationErrors = [];
        
        // Required fields
        if (!formData.firstName.trim()) validationErrors.push('First name is required');
        if (!formData.lastName.trim()) validationErrors.push('Last name is required');
        if (!formData.username.trim()) validationErrors.push('Username is required');
        if (formData.username && formData.username.length < 3) {
            validationErrors.push('Username must be at least 3 characters long');
        }
        if (!formData.email.trim()) validationErrors.push('Email is required');
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            validationErrors.push('Please enter a valid email address');
        }
        
        // Phone number validation (optional but if provided, validate format)
        if (formData.phoneNumber && !/^[0-9+\-\s()]{7,20}$/.test(formData.phoneNumber)) {
            validationErrors.push('Please enter a valid phone number');
        }
        
        // Password validation
        if (!formData.password) {
            validationErrors.push('Password is required');
        } else if (!isPasswordValid(formData.password)) {
            validationErrors.push('Password must be at least 8 characters with uppercase, number, and symbol');
        }
        
        if (formData.password !== formData.confirmPassword) {
            validationErrors.push('Passwords do not match');
        }

        return validationErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setSuccessMessage('');

        const validationErrors = validateForm();

        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            const response = await authAPI.register({
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                phoneNumber: formData.phoneNumber.trim() || null,
                gender: formData.gender,
                birthday: formData.birthday || null,
                password: formData.password,
                role: formData.role
            });

            if (response.success) {
                setSuccessMessage('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login', { state: { message: 'Registration successful! Please log in to continue.' } });
                }, 1500);
            } else {
                setErrors([response.message || 'Registration failed']);
            }
        } catch (err) {
            setErrors([err.message || 'An error occurred during registration']);
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
                            <p className="text-base sm:text-lg font-semibold opacity-80 mb-2">Join the adventure</p>
                            <h1 className="text-2xl sm:text-4xl font-extrabold leading-snug">Become part of<br />Zoo Bulusan family</h1>
                        </div>
                        <div className="mt-6 sm:mt-10 opacity-80 text-sm">
                            <p className="mb-2 font-medium">Experience</p>
                            <div className="flex flex-wrap gap-2 opacity-90 text-xs">
                                <span className="bg-white/10 px-2 py-1 rounded">Wildlife Tours</span>
                                <span className="bg-white/10 px-2 py-1 rounded">AI Scanner</span>
                                <span className="bg-white/10 px-2 py-1 rounded">Events</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:w-1/2 w-full p-6 sm:p-8 flex flex-col justify-center max-h-[90vh] overflow-y-auto">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1">Create your Account</h1>
                    <p className="text-gray-500 text-sm mb-6">Register to explore Zoo Bulusan&apos;s amazing wildlife.</p>

                    {successMessage && (
                        <div className="p-3 mb-4 rounded-lg bg-green-50 text-green-800 border border-green-200 flex items-center gap-3">
                            <span className="flex-shrink-0"><SuccessIcon /></span>
                            <span className="text-sm font-medium">{successMessage}</span>
                        </div>
                    )}

                    {errors.length > 0 && (
                        <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                                <ErrorIcon />
                                <span className="font-medium text-sm">Please fix the following errors:</span>
                            </div>
                            <ul className="list-disc pl-8 m-0 text-sm space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    autoComplete="given-name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                    placeholder="Juan"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    autoComplete="family-name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                    placeholder="Dela Cruz"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                autoComplete="username"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                placeholder="juandelacruz"
                            />
                            {touched.username && formData.username && formData.username.length < 3 && (
                                <p className="text-xs text-red-600 mt-1">Username must be at least 3 characters</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                                autoComplete="email"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                placeholder="juan@example.com"
                            />
                            {touched.email && formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                                <p className="text-xs text-red-600 mt-1">Please enter a valid email address</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="tel"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                    placeholder="09123456789"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
                                >
                                    <option value="prefer_not_to_say">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white"
                                >
                                    <option value="user">Visitor</option>
                                    <option value="staff">Staff</option>
                                    <option value="vet">Veterinarian</option>
                                    <option value="admin">Administrator</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Select your account type</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
                                <input
                                    type="date"
                                    name="birthday"
                                    value={formData.birthday}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    autoComplete="new-password"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent pr-10"
                                    placeholder="Min. 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 hover:text-green-700 focus:outline-none"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            {/* Password strength indicator */}
                            {formData.password && (
                                <div className="mt-2 space-y-1">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className={`flex items-center gap-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordValidation.minLength ? <CheckIcon /> : <XIcon />}
                                            <span>8+ characters</span>
                                        </div>
                                        <div className={`flex items-center gap-1 ${passwordValidation.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordValidation.hasUppercase ? <CheckIcon /> : <XIcon />}
                                            <span>Uppercase letter</span>
                                        </div>
                                        <div className={`flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordValidation.hasNumber ? <CheckIcon /> : <XIcon />}
                                            <span>Number</span>
                                        </div>
                                        <div className={`flex items-center gap-1 ${passwordValidation.hasSymbol ? 'text-green-600' : 'text-gray-400'}`}>
                                            {passwordValidation.hasSymbol ? <CheckIcon /> : <XIcon />}
                                            <span>Symbol (!@#$...)</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    autoComplete="new-password"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent pr-10"
                                    placeholder="Confirm password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 hover:text-green-700 focus:outline-none"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            {touched.confirmPassword && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Register'}
                        </button>
                    </form>

                    <div className="text-center mt-6 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-green-600 hover:underline font-medium">
                            Login
                        </Link>
                    </div>
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

export default RegisterPage;