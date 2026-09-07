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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findAuthenticatedById(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if user is suspended (but allow access to appeal routes)
        const isAppealRoute = req.path.includes('/appeals');
        const isProfileRoute = req.path === '/profile' && req.method === 'GET';
        
        if (user.is_suspended && !isAppealRoute && !isProfileRoute) {
            return res.status(403).json({ 
                success: false, 
                message: 'Your account has been suspended. Please submit an appeal to regain access.',
                suspended: true,
                suspensionReason: user.suspension_reason
            });
        }

        req.user = { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            is_suspended: user.is_suspended 
        };
        req.authPayload = decoded;
        next();
    } catch (error) {
        console.error('Auth error');
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

exports.requireAdminMasterKey = async (req, res, next) => {
    if (req.user?.role !== 'admin') return next();
    try {
        const AdminMasterKey = require('../models/admin-master-key-model');
        const status = await AdminMasterKey.getStatus(req.user.id);
        if (status.enabled && req.authPayload?.masterKeyVerified !== true) {
            return res.status(403).json({ success: false, message: 'Master Key verification required', masterKeyRequired: true });
        }
        next();
    } catch (error) {
        console.error('Master Key authorization error');
        return res.status(403).json({ success: false, message: 'Unable to verify admin security settings' });
    }
};

exports.optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findAuthenticatedById(decoded.id);

            if (user) {
                req.user = { id: user.id, email: user.email, role: user.role };
            }
        } catch (error) {
            // invalid token
        }
    }
    next();
};
