const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user-model');

const VALID_ROLES = ['admin', 'staff', 'vet', 'user'];
const VALID_GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];

// Password validation helper
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

// Input sanitization helper
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

        const tabId = req.headers['x-tab-id'] || req.body.tabId || null;
        const token = generateToken(userId, userRole, tabId);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: { 
                id: userId, 
                firstName, 
                lastName, 
                username, 
                email, 
                role: userRole 
            }
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
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
        }

        if (loginType === 'admin' && !['admin', 'staff', 'vet'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const tabId = req.headers['x-tab-id'] || req.body.tabId || null;
        const token = generateToken(user.id, user.role, tabId);

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
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};