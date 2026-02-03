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
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        req.user = { id: user.id, email: user.email, role: user.role };
        next();
    } catch (error) {
        console.error('\x1b[31mAuth middleware error: ' + error + '\x1b[0m');
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
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (user) {
                req.user = { id: user.id, email: user.email, role: user.role };
            }
        } catch (error) {
            console.log('\x1b[33mOptional auth: Invalid token\x1b[0m');
        }
    }
    next();
};