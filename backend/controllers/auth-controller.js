const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user-model');
const StaffActivity = require('../models/staff-activity-model');
const UserActivity = require('../models/user-activity-model');
const { deleteOldProfileImage } = require('../middleware/upload-profile-image');
const { deleteFromCloudinary, extractPublicId } = require('../middleware/cloudinary-upload');
const { sendVerificationEmail, sendVerificationEmailSync, sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');
const { notifyManagement, notifyUser } = require('../services/notification-service');
const { validateUsername, RESERVED_USERNAMES } = require('../utils/username-rules');
const { checkPersisted } = require('../utils/persist-check');
const AdminMasterKey = require('../models/admin-master-key-model');
const { jwtSecret, jwtExpire } = require('../config/secrets');
const { newTokenId, revoke } = require('../models/revoked-token-model');

const VALID_ROLES = ['admin', 'staff', 'user'];
const VALID_GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];


// validate password
const validatePassword = (password) => {
    const errors = [];
    
    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return errors;
};

// sanitize input
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
};

// Built-in avatar keys. Must stay in sync with AVATAR_KEYS in
// frontend/src/utils/profile-avatars.js (DEFAULT_AVATARS).
const VALID_AVATAR_KEYS = ['deer', 'owl', 'dove', 'eagle', 'horse', 'tiger', 'monkey', 'ostrich', 'parrot', 'rabbit'];

/**
 * Validate a client-supplied profile image value.
 *
 * profileImage is persisted to users.profile_image, which is later fed to
 * deleteOldProfileImage() as a path. Accepting arbitrary strings here would let
 * a client store a traversal payload, so only these forms are allowed:
 *   - a built-in avatar key    -> the AvatarSelector feature
 *   - the value already on record -> previously issued by the upload endpoint
 * Absent or nullish input keeps the stored value, matching the previous
 * `req.body.profileImage ?? existing` behaviour. Anything else (relative path,
 * traversal string, foreign URL) is rejected with 400.
 * Removing an image is a separate concern handled by deleteProfileImage().
 *
 * @param {unknown} value - Raw value from the request body
 * @param {string} existingValue - The value currently stored for this user
 * @returns {{ok: true, value: string|null}|{ok: false}}
 */
const resolveProfileImageInput = (value, existingValue) => {
    if (value === undefined || value === null || value === '') {
        return { ok: true, value: existingValue ?? null };
    }
    if (typeof value !== 'string') {
        return { ok: false };
    }

    const trimmed = value.trim();

    if (VALID_AVATAR_KEYS.includes(trimmed)) {
        return { ok: true, value: trimmed };
    }

    // Keep the caller's existing value: a URL previously issued by the upload
    // endpoint, or an avatar key. Anything else is refused.
    if (typeof existingValue === 'string' && existingValue === value) {
        return { ok: true, value: existingValue };
    }

    return { ok: false };
};

/**
 * Map a username validation result to an HTTP status.
 * @param {{ok?: boolean, taken?: boolean}} result
 * @returns {number|null} 400 invalid, 409 taken, null when the name is usable
 */
const usernameErrorStatus = (result) => {
    if (result && result.taken) return 409;
    if (!result || result.ok !== true) return 400;
    return null;
};

const generateToken = (userId, role, tabId = null) => {
    const payload = { id: userId, role, jti: newTokenId() };
    if (tabId) payload.tabId = tabId;
    return jwt.sign(
        payload,
        jwtSecret,
        { expiresIn: jwtExpire }
    );
};

exports.register = async (req, res) => {
    try {
        const { firstName, lastName, username, email, phoneNumber, gender, birthday, password, role } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !username || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Sanitize inputs
        const sanitizedFirstName = sanitizeInput(firstName);
        const sanitizedLastName = sanitizeInput(lastName);
        const sanitizedUsername = sanitizeInput(username);
        const sanitizedEmail = sanitizeInput(email).toLowerCase();

        // Validate username length
        if (sanitizedUsername.length < 3) {
            return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        // Validate password strength
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ success: false, message: passwordErrors[0] });
        }

        // Validate phone number format (optional field)
        if (phoneNumber && !/^[0-9+\-\s()]{7,20}$/.test(phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid phone number' });
        }

        const existingEmail = await User.findByEmail(sanitizedEmail);
// One response for both collisions. Saying which field collided let anyone with
// a list of emails enumerate every registered account; the same generic shape
// requestPasswordReset() already returns is used here.
const ALREADY_IN_USE_RESPONSE = {
    status: 400,
    body: { success: false, message: 'Email or username is already in use.' }
};

        if (existingEmail) {
            return res.status(ALREADY_IN_USE_RESPONSE.status).json(ALREADY_IN_USE_RESPONSE.body);
        }

        const existingUsername = await User.findByUsername(sanitizedUsername);
        if (existingUsername) {
            return res.status(ALREADY_IN_USE_RESPONSE.status).json(ALREADY_IN_USE_RESPONSE.body);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Force role to 'user' for public registration - admins must be created via admin panel
        const userRole = 'user';
        const userGender = gender && VALID_GENDERS.includes(gender) ? gender : 'prefer_not_to_say';
        
        const userId = await User.create({
            firstName: sanitizedFirstName,
            lastName: sanitizedLastName,
            username: sanitizedUsername,
            email: sanitizedEmail,
            phoneNumber: phoneNumber ? sanitizeInput(phoneNumber) : null,
            gender: userGender,
            birthday: birthday || null,
            password: hashedPassword,
            role: userRole
        });

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await User.setVerificationToken(userId, verificationToken, tokenExpires);

        // Send verification email
        try {
            await sendVerificationEmail(sanitizedEmail, verificationToken, sanitizedFirstName);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError.message);
            // Continue registration even if email fails - user can request resend
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            requiresVerification: true
        });

        // Log user registration
        if (userRole === 'user') {
            const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await UserActivity.logActivity({
                userId,
                actionType: 'register',
                actionDescription: 'Created an account',
                entityType: 'user',
                entityId: userId,
                ipAddress,
                userAgent
            });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, password, loginType } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
        }

        const user = await User.findByEmailOrUsername(identifier);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid Email/Username or Password' });
        }

        if (user.is_suspended) {
            return res.status(403).json({ 
                success: false, 
                message: 'Your account has been suspended.',
                suspended: true,
                suspensionReason: user.suspension_reason || 'No reason provided',
                suspendedAt: user.suspended_at,
                userId: user.id,
                email: user.email
            });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
        }

        if (!user.password) {
            return res.status(401).json({ 
                success: false, 
                message: 'This account uses Google Sign-In. Please use the "Continue with Google" button.' 
            });
        }

        // Check email verification status
        if (!user.email_verified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in. Check your inbox for the verification link.',
                requiresVerification: true,
                email: user.email
            });
        }

        if (loginType === 'admin' && !['admin', 'staff'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.role === 'admin') {
            const masterKeyStatus = await AdminMasterKey.getStatus(user.id);
            if (masterKeyStatus.enabled) {
                const tabId = req.headers['x-tab-id'] || req.body.tabId || null;
                const challengeToken = jwt.sign(
                    { id: user.id, role: 'admin', purpose: 'admin-master-key', ...(tabId ? { tabId } : {}) },
                    jwtSecret,
                    { expiresIn: '5m' }
                );
                return res.json({
                    success: true,
                    masterKeyRequired: true,
                    challengeToken,
                    user: { id: user.id, role: user.role, firstName: user.first_name, username: user.username }
                });
            }
        }

        const tabId = req.headers['x-tab-id'] || req.body.tabId || null;
        const token = generateToken(user.id, user.role, tabId);

        // Track login for staff/admin
        if (['staff', 'admin'].includes(user.role)) {
            const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            
            // Update last login
            await StaffActivity.updateLastLogin(user.id, ipAddress);
            
            // Create session
            await StaffActivity.createSession({
                staffId: user.id,
                sessionToken: token.substring(0, 50),
                ipAddress,
                userAgent,
                deviceInfo: userAgent.substring(0, 255)
            });
            
            // Log the login activity
            await StaffActivity.logActivity({
                staffId: user.id,
                actionType: 'login',
                actionDescription: 'User logged in',
                ipAddress,
                userAgent
            });
        } else {
            // Log user login
            const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await UserActivity.logActivity({
                userId: user.id,
                actionType: 'login',
                actionDescription: 'Logged in',
                entityType: 'user',
                entityId: user.id,
                ipAddress,
                userAgent
            });

            // One-time welcome email, on a visitor's first successful login. The gate is
            // only set on a real delivery so an SMTP fault retries next login.
            if (!user.is_welcome_sent) {
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                const delivered = await sendWelcomeEmail({
                    email: user.email,
                    firstName: user.first_name,
                    username: user.username,
                    profileUrl: `${frontendUrl}/profile`,
                    hasPassword: Boolean(user.password)
                });
                if (delivered) {
                    await User.markWelcomeSent(user.id);
                }
            }
        }

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                email: user.email,
                phoneNumber: user.phone_number,
                gender: user.gender,
                birthday: user.birthday,
                role: user.role,
                profileImage: user.profile_image,
                hasPassword: Boolean(user.password),
                authProvider: user.auth_provider || (user.google_id ? 'google' : 'local')
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required'
            });
        }

        const user = await User.findByVerificationToken(token);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Check token expiration
        if (new Date() > new Date(user.email_verification_token_expiry)) {
            await User.clearVerificationToken(user.id);
            return res.status(400).json({
                success: false,
                message: 'Verification link has expired. Please request a new one.'
            });
        }

        // Verify the email
        await User.verifyEmail(user.id);

        // Redirect to frontend with success message
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        return res.redirect(`${frontendUrl}/login?verified=true`);
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during email verification'
        });
    }
};

exports.resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findByEmail(email.toLowerCase().trim());

        if (!user) {
            // Don't reveal if email exists
            return res.json({
                success: true,
                message: 'If your email is registered, you will receive a verification link.'
            });
        }

        if (user.email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified. You can log in.'
            });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await User.setVerificationToken(user.id, verificationToken, tokenExpires);

        // Send verification email
        try {
            await sendVerificationEmail(user.email, verificationToken, user.first_name);
        } catch (emailError) {
            console.error('Failed to resend verification email:', emailError.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email. Please try again later.'
            });
        }

        res.json({
            success: true,
            message: 'Verification email sent. Please check your inbox.'
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resending verification email'
        });
    }
};

exports.requestPasswordReset = async (req, res) => {
    const genericResponse = {
        success: true,
        message: 'If an account exists for that email, a password reset link has been sent.'
    };

    try {
        const email = sanitizeInput(req.body.email || '').toLowerCase();
        if (!email) return res.json(genericResponse);

        const user = await User.findByEmail(email);
        if (!user || !user.is_active) return res.json(genericResponse);

        const token = crypto.randomBytes(32).toString('hex');
        await User.setPasswordResetToken(user.id, token, new Date(Date.now() + 60 * 60 * 1000));
        await sendPasswordResetEmail(user.email, token, user.first_name);
        return res.json(genericResponse);
    } catch (error) {
        console.error('Request password reset error:', error);
        return res.json(genericResponse);
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
        }

        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ success: false, message: passwordErrors[0] });
        }

        const resetUser = await User.findByPasswordResetToken(token);
        if (!resetUser || !resetUser.password_reset_token_expiry || new Date() > new Date(resetUser.password_reset_token_expiry)) {
            return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updated = await User.updatePasswordWithResetToken(token, hashedPassword);
        if (!updated) {
            return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired.' });
        }

        return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ success: false, message: 'Server error while resetting password' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                email: user.email,
                phoneNumber: user.phone_number,
                gender: user.gender,
                birthday: user.birthday,
                role: user.role,
                profileImage: user.profile_image,
                hasPassword: Boolean(user.password),
                authProvider: user.auth_provider || (user.google_id ? 'google' : 'local'),
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, gender, birthday, profileImage } = req.body;
        const existingUser = await User.findById(req.user.id);
        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // profileImage must not be taken from the body unchecked: it is persisted
        // and later used as a filesystem path. See resolveProfileImageInput().
        const resolvedImage = resolveProfileImageInput(profileImage, existingUser.profile_image);
        if (!resolvedImage.ok) {
            return res.status(400).json({
                success: false,
                message: 'Invalid profile image value'
            });
        }

        const updated = await User.updateProfile(req.user.id, {
            firstName: firstName !== undefined ? sanitizeInput(firstName) : existingUser.first_name,
            lastName: lastName !== undefined ? sanitizeInput(lastName) : existingUser.last_name,
            phoneNumber: phoneNumber !== undefined ? sanitizeInput(phoneNumber) : existingUser.phone_number,
            gender: gender !== undefined ? gender : existingUser.gender,
            birthday: birthday !== undefined ? birthday : existingUser.birthday,
            profileImage: resolvedImage.value
        });

        if (!updated) {
            return res.status(400).json({ success: false, message: 'Failed to update profile' });
        }

        const user = await User.findById(req.user.id);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                username: user.username,
                email: user.email,
                phoneNumber: user.phone_number,
                gender: user.gender,
                birthday: user.birthday,
                role: user.role,
                profileImage: user.profile_image
            }
        });

        // Log profile update for users
        if (req.user.role === 'user') {
            const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await UserActivity.logActivity({
                userId: req.user.id,
                actionType: 'profile_update',
                actionDescription: 'Updated profile',
                entityType: 'user',
                entityId: req.user.id,
                ipAddress,
                userAgent
            });
        }
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateEmail = async (req, res) => {
    try {
        const email = sanitizeInput(req.body.email || '').toLowerCase();
        const { currentPassword } = req.body;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (email === user.email.toLowerCase()) {
            return res.status(400).json({ success: false, message: 'This is already your email address' });
        }
        if (!user.password) {
            return res.status(400).json({ success: false, message: 'Set an account password before changing your email address' });
        }
        if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        if (await User.findByEmail(email)) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await User.changeEmailForVerification(user.id, email, token, expiresAt);
        let delivered = false;
        try {
            delivered = await sendVerificationEmailSync(email, token, user.first_name);
        } catch (emailError) {
            console.error('Changed-email verification delivery failed:', emailError.message);
        }
        if (!delivered) {
            await User.restoreEmailState(
                user.id,
                user.email,
                user.email_verified,
                user.email_verification_token,
                user.email_verification_token_expiry
            );
            return res.status(503).json({ success: false, message: 'Could not send the verification email. Your email address was not changed.' });
        }

        return res.json({
            success: true,
            message: 'Email changed. Verify the new address before your next login.',
            email,
            requiresVerification: true
        });
    } catch (error) {
        console.error('Update email error:', error);
        return res.status(500).json({ success: false, message: 'Server error while changing email' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide a new password' });
        }

        // Validate new password strength
        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ success: false, message: passwordErrors[0] });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.password) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Please provide your current password' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updatePassword(req.user.id, hashedPassword);

        const tabId = req.headers['x-tab-id'] || req.body.tabId || null;
        const token = generateToken(req.user.id, req.user.role, tabId);

        // Fired without awaiting: this endpoint returns a fresh token the client stores,
        // so any delay here is directly visible to the person changing their password.
        notifyUser(req.user.id, 'account.password_set', {}, '/profile')
            .catch(error => console.error('Password-set notification failed:', error.message));

        res.json({
            success: true,
            message: 'Password updated successfully',
            token
        });

        // Log password change for users
        if (req.user.role === 'user') {
            const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await UserActivity.logActivity({
                userId: req.user.id,
                actionType: 'password_change',
                actionDescription: 'Changed password',
                entityType: 'user',
                entityId: req.user.id,
                ipAddress,
                userAgent
            });
        }
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Set the authenticated user's display name.
 *
 * No token is reissued: `username` is not part of the JWT payload, so the existing
 * session stays valid.
 */
exports.setUsername = async (req, res) => {
    try {
        const validation = validateUsername(req.body?.username);
        const status = usernameErrorStatus(validation);
        if (status) {
            return res.status(status).json({ success: false, message: validation.error });
        }

        if (!(await User.isUsernameAvailable(validation.value, req.user.id))) {
            return res.status(409).json({ success: false, message: 'That name is already taken.' });
        }

        await User.setUsername(req.user.id, validation.value);

        // Read-back is the source of truth: an unchanged name is a successful no-op.
        const saved = await User.findById(req.user.id);
        if (!checkPersisted({ username: saved?.username }, { username: validation.value })) {
            return res.status(500).json({ success: false, message: 'Could not save your name. Please try again.' });
        }

        res.json({ success: true, username: saved.username });
    } catch (error) {
        console.error('Set username error:', error);
        res.status(500).json({ success: false, message: 'Server error while saving your name' });
    }
};

/** Check whether a username is free. Never reveals the account behind a taken name. */
exports.checkUsername = async (req, res) => {
    try {
        const validation = validateUsername(req.query?.name);
        if (!validation.ok) {
            return res.status(400).json({ success: false, message: validation.error });
        }
        const available = await User.isUsernameAvailable(validation.value, req.user.id);
        res.json({ success: true, available });
    } catch (error) {
        console.error('Check username error:', error);
        res.status(500).json({ success: false, message: 'Server error while checking that name' });
    }
};

/**
 * Mark the one-time Google onboarding stepper complete and send the welcome email.
 *
 * Reaching done means the visitor was *offered* the choices, not that they took them,
 * so skipping either step still completes onboarding.
 */
exports.completeOnboarding = async (req, res) => {
    try {
        await User.markOnboardingComplete(req.user.id);

        const user = await User.findById(req.user.id);
        if (user && !user.is_welcome_sent) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const delivered = await sendWelcomeEmail({
                email: user.email,
                firstName: user.first_name,
                username: user.username,
                profileUrl: `${frontendUrl}/profile`,
                hasPassword: Boolean(user.password)
            });
            // Only consume the welcome on a real success, so a transient SMTP fault
            // does not permanently skip it.
            if (delivered) {
                await User.markWelcomeSent(user.id);
            }
        }

        res.json({ success: true });
    } catch (error) {
        // Non-fatal for the visitor: the stepper navigates away regardless, and the
        // worst case is that onboarding is offered again next sign-in.
        console.error('Complete onboarding error:', error);
        res.status(500).json({ success: false, message: 'Could not complete setup' });
    }
};

/**
 * Create a password for an account that has none.
 *
 * Google sign-in leaves users.password NULL, which blocks any password-gated action —
 * permanently deleting archived reservations, changing the email address, deleting the
 * account. This endpoint exists solely to close that gap.
 *
 * It refuses to run when a password already exists, so it can never be used to silently
 * take over a local account; changing an existing password stays on /updatepassword, which
 * asks for the current one.
 */
exports.setInitialPassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body || {};

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (user.password) {
            return res.status(409).json({
                success: false,
                message: 'This account already has a password. Use the change-password form instead.'
            });
        }

        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length) {
            return res.status(400).json({ success: false, message: passwordErrors[0], errors: passwordErrors });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match' });
        }

        await User.updatePassword(req.user.id, await bcrypt.hash(newPassword, 12));

        try {
            notifyUser(req.user.id, 'account.password_set', {}, '/profile');
        } catch (notifyError) {
            console.error('Password-set notification failed:', notifyError.message);
        }

        return res.json({ success: true, message: 'Password created for your account.' });
    } catch (error) {
        console.error('Error setting initial password:', error);
        return res.status(500).json({ success: false, message: 'Could not create a password right now.' });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: 'Please provide your password to confirm deletion' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.password) {
            return res.status(400).json({ success: false, message: 'Please add a password to your account before deleting it.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password is incorrect' });
        }

        if (user.profile_image && user.profile_image.includes('cloudinary.com')) {
            try {
                await deleteFromCloudinary(extractPublicId(user.profile_image));
            } catch (imageError) {
                console.error('Could not remove account profile image:', imageError.message);
            }
        }

        if (req.user.role === 'user') {
            const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await UserActivity.logActivity({
                userId: req.user.id,
                actionType: 'account_delete',
                actionDescription: 'Deleted account',
                entityType: 'user',
                entityId: req.user.id,
                ipAddress,
                userAgent
            });
        }

        await User.deleteAccountData(req.user.id);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.logout = async (req, res) => {
  // Actually invalidate the presented token. Logout previously only recorded an
  // activity row, so a stolen JWT stayed usable right up to its 7 day expiry.
  try {
    const header = req.headers.authorization || '';
    const presented = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (presented) {
      // Decoded, not verified: protect() already checked the signature on this
      // route, and only the jti/exp claims are needed here.
      await revoke(jwt.decode(presented));
    }
  } catch (revokeError) {
    console.error('Could not revoke token on logout:', revokeError.message);
  }

    try {
        // Track logout for staff/admin
        if (req.user && ['staff', 'admin'].includes(req.user.role)) {
            const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            
            // End the session
            await StaffActivity.endSession(req.user.id);
            
            // Log the logout activity
            await StaffActivity.logActivity({
                staffId: req.user.id,
                actionType: 'logout',
                actionDescription: 'User logged out',
                ipAddress,
                userAgent
            });
        } else if (req.user) {
            // Log user logout
            const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
            const userAgent = req.headers['user-agent'] || 'unknown';
            await UserActivity.logActivity({
                userId: req.user.id,
                actionType: 'logout',
                actionDescription: 'Logged out',
                entityType: 'user',
                entityId: req.user.id,
                ipAddress,
                userAgent
            });
        }
        
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.cloudinaryResult || !req.cloudinaryResult.secure_url) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Get user's current profile image to delete old one
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete old profile image if it exists and is not the default
        if (user.profile_image) {
            if (user.profile_image.includes('cloudinary.com')) {
                const oldPublicId = extractPublicId(user.profile_image);
                if (oldPublicId) {
                    await deleteFromCloudinary(oldPublicId);
                }
            } else {
                deleteOldProfileImage(user.profile_image);
            }
        }

        // Get the secure URL from Cloudinary
        const profileImagePath = req.cloudinaryResult.secure_url;

        // Update user profile with new image path
        await User.updateProfile(req.user.id, {
            firstName: user.first_name,
            lastName: user.last_name,
            phoneNumber: user.phone_number,
            gender: user.gender,
            birthday: user.birthday,
            profileImage: profileImagePath
        });

        // Get updated user data
        const updatedUser = await User.findById(req.user.id);

        res.json({
            success: true,
            message: 'Profile image uploaded successfully',
            profileImage: profileImagePath,
            user: {
                id: updatedUser.id,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                username: updatedUser.username,
                email: updatedUser.email,
                phoneNumber: updatedUser.phone_number,
                gender: updatedUser.gender,
                birthday: updatedUser.birthday,
                role: updatedUser.role,
                profileImage: updatedUser.profile_image
            }
        });
    } catch (error) {
        console.error('Upload profile image error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading profile image'
        });
    }
};

exports.deleteProfileImage = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete the profile image file if it exists
        if (user.profile_image) {
            // Check if it's a Cloudinary URL
            if (user.profile_image.includes('cloudinary.com')) {
                const publicId = extractPublicId(user.profile_image);
                if (publicId) {
                    await deleteFromCloudinary(publicId);
                }
            } else {
                // Delete local file
                deleteOldProfileImage(user.profile_image);
            }
        }

        // Update user profile to remove image reference
        await User.updateProfile(req.user.id, {
            firstName: user.first_name,
            lastName: user.last_name,
            phoneNumber: user.phone_number,
            gender: user.gender,
            birthday: user.birthday,
            profileImage: null
        });

        res.json({
            success: true,
            message: 'Profile image removed successfully'
        });
    } catch (error) {
        console.error('Delete profile image error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing profile image'
        });
    }
};

// Public appeal submission for suspended users (no auth required)
exports.submitPublicAppeal = async (req, res) => {
    try {
        const { email, content, subject } = req.body;

        if (!email || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and appeal message are required' 
            });
        }

        // Find user by email
        const user = await User.findByEmail(email.toLowerCase().trim());
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with this email' });
        }

        // Verify user is actually suspended (using is_suspended field, not status)
        if (!user.is_suspended) {
            return res.status(400).json({ success: false, message: 'This action is only available for suspended accounts' });
        }

        // Create the appeal in user_appeals table (used by admin review flow)
        const appealId = await User.createAppeal(user.id, content.trim());

        // Notify admins
        await notifyManagement({
            title: 'New Suspension Appeal',
            message: `${user.first_name} ${user.last_name} has submitted a suspension appeal`,
            type: 'warning',
            link: '/admin/messages'
        });

        res.status(201).json({ 
            success: true, 
            message: 'Appeal submitted successfully. You will be notified of the decision via email.',
            appealId 
        });
    } catch (error) {
        console.error('Error submitting public appeal:', error);
        res.status(500).json({ success: false, message: 'Error submitting appeal' });
    }
};

// Exported for unit testing only; not routed.
module.exports.usernameErrorStatus = usernameErrorStatus;
module.exports.resolveProfileImageInput = resolveProfileImageInput;
