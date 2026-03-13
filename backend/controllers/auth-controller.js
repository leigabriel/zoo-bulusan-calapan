const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user-model');
const StaffActivity = require('../models/staff-activity-model');
const { deleteOldProfileImage } = require('../middleware/upload-profile-image');
const { deleteFromCloudinary, extractPublicId } = require('../middleware/cloudinary-upload');
const { sendVerificationEmail } = require('../utils/email');

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

const generateToken = (userId, role, tabId = null) => {
    const payload = { id: userId, role };
    if (tabId) payload.tabId = tabId;
    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
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
        if (existingEmail) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const existingUsername = await User.findByUsername(sanitizedUsername);
        if (existingUsername) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Validate role - accept role from registration if valid, otherwise default to 'user'
        const userRole = role && VALID_ROLES.includes(role) ? role : 'user';
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
                profileImage: user.profile_image
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
        const { firstName, lastName, phoneNumber, gender, birthday } = req.body;

        const updated = await User.updateProfile(req.user.id, {
            firstName,
            lastName,
            phoneNumber,
            gender,
            birthday,
            profileImage: req.body.profileImage || null
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
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide both current and new password' });
        }

        // Validate new password strength
        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ success: false, message: passwordErrors[0] });
        }

        const user = await User.findByEmailOrUsername(req.user.email || req.user.username);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updatePassword(req.user.id, hashedPassword);

        const tabId = req.headers['x-tab-id'] || req.body.tabId || null;
        const token = generateToken(req.user.id, req.user.role, tabId);

        res.json({
            success: true,
            message: 'Password updated successfully',
            token
        });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: 'Please provide your password to confirm deletion' });
        }

        const user = await User.findByEmailOrUsername(req.user.email || req.user.username);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password is incorrect' });
        }

        await User.delete(req.user.id);

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

        const db = require('../config/database');
        const Message = require('../models/message-model');
        const Notification = require('../models/notification-model');

        // Create the appeal message
        const messageId = await Message.createAppealMessage({
            senderId: user.id,
            subject: subject || 'Suspension Appeal',
            content: content.trim()
        });

        // Notify admins
        const admins = await User.getByRole('admin');
        for (const admin of admins) {
            try {
                await Notification.create({
                    userId: admin.id,
                    title: 'New Suspension Appeal',
                    message: `${user.first_name} ${user.last_name} has submitted a suspension appeal`,
                    type: 'appeal',
                    link: '/admin/messages'
                });
            } catch (notifyError) {
                console.error('Error notifying admin:', notifyError);
            }
        }

        res.status(201).json({ 
            success: true, 
            message: 'Appeal submitted successfully. You will be notified of the decision via email.',
            messageId 
        });
    } catch (error) {
        console.error('Error submitting public appeal:', error);
        res.status(500).json({ success: false, message: 'Error submitting appeal' });
    }
};