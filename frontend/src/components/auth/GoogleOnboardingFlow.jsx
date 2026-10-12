import { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { authAPI } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from '../common/PasswordInput';
import useScrollLock from '../../hooks/use-scroll-lock';

// Mirrors backend/utils/username-rules.js for inline feedback only. The server remains
// authoritative: every response below overrides what this predicts.
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 50;

const localUsernameProblem = (value) => {
    if (!value) return 'Please choose a name.';
    if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
        return `Name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`;
    }
    if (!USERNAME_PATTERN.test(value)) {
        return 'Use letters, numbers, dots, hyphens and underscores only.';
    }
    return null;
};

// Mirrors validatePassword in backend/controllers/auth-controller.js so the visitor sees the
// same rules before the round trip.
const passwordProblems = (value) => {
    const problems = [];
    if (!value || value.length < 8) problems.push('At least 8 characters');
    if (!/[A-Z]/.test(value || '')) problems.push('An uppercase letter');
    if (!/[0-9]/.test(value || '')) problems.push('A number');
    if (!/[!@#$%^&*()_+\-=[{};':"\\|,.<>/?]/.test(value || '')) problems.push('A special character');
    return problems;
};

const GoogleOnboardingFlow = ({ isOpen, user, hasPassword, onComplete }) => {
    const { updateUser } = useAuth();
    const [step, setStep] = useState('username');
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState(null);
    const [checking, setChecking] = useState(false);
    const [availability, setAvailability] = useState(null);
    const [savingName, setSavingName] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState(null);
    const [savingPassword, setSavingPassword] = useState(false);
    const headingRef = useRef(null);
    const checkTimerRef = useRef(null);

    useScrollLock(isOpen);

    const initialUsername = user?.username || '';

    // Reset to a clean state whenever the flow opens for a new account.
    useEffect(() => {
        if (isOpen) {
            setStep('username');
            setUsername(initialUsername);
            setUsernameError(null);
            setAvailability(null);
            setChecking(false);
            setShowPasswordForm(false);
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError(null);
        }
    }, [isOpen, initialUsername]);

    // Move focus to the step heading so keyboard and screen-reader users land correctly.
    useEffect(() => {
        if (isOpen && headingRef.current) {
            headingRef.current.focus();
        }
    }, [isOpen, step]);

    // Escape and backdrop clicks are deliberately disabled: the visitor must either confirm
    // or take an explicit skip branch, so focus can never be stranded mid-step.
    const localProblem = usernameError ? null : localUsernameProblem(username);

    useEffect(() => {
        if (step !== 'username') return undefined;
        const value = username.trim();
        if (localUsernameProblem(value)) {
            setAvailability(null);
            return undefined;
        }
        setChecking(true);
        clearTimeout(checkTimerRef.current);
        checkTimerRef.current = setTimeout(async () => {
            try {
                const response = await authAPI.checkUsername(value);
                setAvailability(Boolean(response?.available));
            } catch {
                // The submit path is authoritative; a failed pre-check must not block it.
                setAvailability(null);
            } finally {
                setChecking(false);
            }
        }, 400);
        return () => clearTimeout(checkTimerRef.current);
    }, [username, step]);

    const finish = useCallback(() => {
        // Advance FIRST, then fire the bookkeeping call. Awaiting it here made both
        // skip buttons look dead: api-client has no request timeout, so a slow or
        // hung POST /auth/onboarding/complete meant onComplete() never ran and the
        // modal never dismissed. Completing onboarding is just a flag + welcome email,
        // so losing it only means the stepper is offered again next sign-in.
        authAPI.completeOnboarding().catch(() => {});
        onComplete?.();
    }, [onComplete]);

    // A visitor who already has a password (e.g. a Google account linked to an existing local
// one) skips the password step entirely and goes straight to done.
    const advanceFromName = useCallback(() => {
        if (hasPassword) {
            finish();
            return;
        }
        setStep('password');
    }, [hasPassword, finish]);

    const saveUsername = useCallback(async () => {
        setSavingName(true);
        setUsernameError(null);
        try {
            const response = await authAPI.setUsername(username.trim());
            updateUser({ ...user, username: response.username });
            advanceFromName();
        } catch (error) {
            setUsernameError(error.message || 'Could not save your name. Please try again.');
        } finally {
            setSavingName(false);
        }
    }, [username, user, updateUser, advanceFromName]);

    const keepCurrentName = useCallback(() => {
        setUsernameError(null);
        advanceFromName();
    }, [advanceFromName]);

    const submitPassword = useCallback(async () => {
        const problems = passwordProblems(newPassword);
        if (problems.length > 0) {
            setPasswordError(`Password needs ${problems.join(', ')}.`);
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match.');
            return;
        }
        setSavingPassword(true);
        setPasswordError(null);
        try {
            // No currentPassword: the account has none yet, and the server already skips
            // that check when user.password is null.
            await authAPI.updatePassword({ newPassword, confirmPassword });
            // The session object still says hasPassword: false (it came from the OAuth
            // handoff). Without this the Profile page keeps offering "Add Password"
            // after the password was in fact set.
            updateUser({ ...user, hasPassword: true });
            onComplete?.();
        } catch (error) {
            setPasswordError(error.message || 'Could not save your password. Please try again.');
        } finally {
            setSavingPassword(false);
        }
    }, [newPassword, confirmPassword, user, updateUser, onComplete]);

    if (!isOpen || !user) return null;

    const canSubmitName = !localProblem && !savingName && availability !== false;
    const passwordProblemsList = passwordProblems(newPassword);

    const content = (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="google-onboarding-heading"
        >
            {/* pointer-events-none: this backdrop is deliberately non-dismissible, so it
                must never intercept clicks meant for the dialog's own buttons. */}
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm pointer-events-none" aria-hidden="true" />

            {/* z-10 lifts the panel above the backdrop; max-h + overflow-y keeps every
                control reachable on short viewports, where a centred non-scrolling dialog
                would push the bottom buttons off-screen while the page is scroll-locked. */}
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto">
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none" aria-hidden="true" />

                <div className="relative px-6 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
                    {step === 'username' ? (
                        <>
                            <h2
                                id="google-onboarding-heading"
                                ref={headingRef}
                                tabIndex={-1}
                                className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2 outline-none"
                            >
                                What should we call you?
                            </h2>
                            <p className="text-gray-500 text-center text-sm sm:text-base leading-relaxed mb-6">
                                Pick a name for your Bulusan Zoo account.
                            </p>

                            <label htmlFor="onboarding-username" className="sr-only">Display name</label>
                            <input
                                id="onboarding-username"
                                type="text"
                                value={username}
                                autoFocus
                                maxLength={MAX_LENGTH}
                                onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' && canSubmitName) saveUsername(); }}
                                placeholder="e.g. maria.santos"
                                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all"
                                aria-invalid={Boolean(localProblem || usernameError || availability === false)}
                                aria-describedby="onboarding-username-hint"
                            />

                            <p id="onboarding-username-hint" className="mt-2 text-xs text-center min-h-[1rem]" aria-live="polite">
                                {usernameError || localProblem
                                    ? (usernameError || localProblem)
                                    : availability === false
                                        ? 'That name is already taken.'
                                        : checking
                                            ? 'Checking availability…'
                                            : ''}
                            </p>

                            <button
                                type="button"
                                onClick={saveUsername}
                                disabled={!canSubmitName}
                                className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-colors"
                            >
                                {savingName ? 'Saving…' : 'Continue'}
                            </button>

                            <button
                                type="button"
                                onClick={keepCurrentName}
                                className="w-full mt-2 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                            >
                                Keep my current name
                            </button>
                        </>
                    ) : (
                        <>
                            <h2
                                id="google-onboarding-heading"
                                ref={headingRef}
                                tabIndex={-1}
                                className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2 outline-none"
                            >
                                {showPasswordForm ? 'Set a password' : 'Add a password?'}
                            </h2>
                            <p className="text-gray-500 text-center text-sm sm:text-base leading-relaxed mb-6">
                                {showPasswordForm
                                    ? 'Choose a password so you can sign in with your email too.'
                                    : 'You signed in with Google and have no password yet. Adding one lets you sign in with your email address as well.'}
                            </p>

                            {showPasswordForm ? (
                                <>
                                    <label htmlFor="onboarding-password" className="sr-only">New password</label>
                                    <PasswordInput
                                        id="onboarding-password"
                                        placeholder="New password"
                                        value={newPassword}
                                        autoComplete="new-password"
                                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); }}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all"
                                    />

                                    <label htmlFor="onboarding-confirm-password" className="sr-only">Re-enter new password</label>
                                    <PasswordInput
                                        id="onboarding-confirm-password"
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        autoComplete="new-password"
                                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') submitPassword(); }}
                                        className="w-full px-4 py-3 mt-3 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all"
                                    />
                                    <p className="mt-2 text-xs text-gray-500 min-h-[1rem]" aria-live="polite">
                                        {passwordError
                                            || (newPassword && passwordProblemsList.length > 0 ? `Needs ${passwordProblemsList.join(', ')}.` : '')
                                            || (confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match.' : '')}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={submitPassword}
                                        disabled={savingPassword}
                                        className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-colors"
                                    >
                                        {savingPassword ? 'Saving…' : 'Save password'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowPasswordForm(false); setPasswordError(null); }}
                                        className="w-full mt-2 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                                    >
                                        Back
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordForm(true)}
                                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-semibold transition-colors"
                                    >
                                        Add a password
                                    </button>
                                    <button
                                        type="button"
                                        onClick={finish}
                                        className="w-full mt-2 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                                    >
                                        Maybe later
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(content, document.body);
};

export default GoogleOnboardingFlow;