const jwt = require('jsonwebtoken');
const User = require('../models/user-model');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Validate that token is bound to the same tab id (if token contains tabId)
        const reqTabId = req.headers['x-tab-id'];
        if (decoded.tabId) {
            // If token was issued bound to a tabId, require the same header on requests
            if (!reqTabId || decoded.tabId !== reqTabId) {
                return res.status(401).json({ success: false, message: 'Token not valid for this tab' });
            }
        }

        req.user = { id: user.id, email: user.email, role: user.role };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

exports.optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findById(decoded.id);

            if (user) {
                // If token had tabId, ensure request has same X-Tab-ID
                const reqTabId = req.headers['x-tab-id'];
                if (decoded.tabId && decoded.tabId !== reqTabId) {
                    // treat as invalid for this request
                    console.log('Optional auth: token bound to different tab');
                } else {
                    req.user = { id: user.id, email: user.email, role: user.role };
                }
            }
        } catch (error) {
            console.log('Optional auth: Invalid token');
        }
    }

    next();
};