const StaffActivity = require('../models/staff-activity-model');
const UserActivity = require('../models/user-activity-model');

/**
 * Middleware to track staff/admin activities
 * Usage: router.post('/endpoint', trackActivity('action_type', 'description'), controller)
 */
const trackActivity = (actionType, getDescription = null) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = async function(data) {
            if (data.success && req.user) {
                const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
                const userAgent = req.headers['user-agent'] || 'unknown';

                let description = '';
                if (typeof getDescription === 'function') {
                    description = getDescription(req, data);
                } else if (typeof getDescription === 'string') {
                    description = getDescription;
                } else {
                    description = `Performed ${actionType}`;
                }

                let entityType = null;
                let entityId = null;

                if (req.params.id) {
                    entityId = parseInt(req.params.id);
                }

                const path = req.path.toLowerCase();
                if (path.includes('animal')) entityType = 'animal';
                else if (path.includes('plant')) entityType = 'plant';
                else if (path.includes('event')) entityType = 'event';
                else if (path.includes('ticket') || path.includes('reservation')) entityType = 'reservation';
                else if (path.includes('message')) entityType = 'message';
                else if (path.includes('user')) entityType = 'user';
                else if (path.includes('community') || path.includes('post')) entityType = 'community';
                else if (path.includes('comment')) entityType = 'comment';
                else if (path.includes('donation') || path.includes('payment')) entityType = 'config';

                try {
                    if (['staff', 'admin'].includes(req.user.role)) {
                        await StaffActivity.logActivity({
                            staffId: req.user.id,
                            actionType,
                            actionDescription: description,
                            entityType,
                            entityId,
                            ipAddress,
                            userAgent
                        });
                        await StaffActivity.updateSessionActivity(req.user.id);
                    } else if (req.user.role === 'user') {
                        await UserActivity.logActivity({
                            userId: req.user.id,
                            actionType,
                            actionDescription: description,
                            entityType,
                            entityId,
                            ipAddress,
                            userAgent
                        });
                    }
                } catch (error) {
                    console.error('Error tracking activity:', error);
                }
            }

            return originalJson(data);
        };

        next();
    };
};

/**
 * Activity tracking helper for manual use in controllers (staff/admin)
 */
const logStaffActivity = async (req, actionType, description, entityType = null, entityId = null) => {
    if (!req.user || !['staff', 'admin'].includes(req.user.role)) {
        return;
    }

    try {
        const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        await StaffActivity.logActivity({
            staffId: req.user.id,
            actionType,
            actionDescription: description,
            entityType,
            entityId,
            ipAddress,
            userAgent
        });

        await StaffActivity.updateSessionActivity(req.user.id);
    } catch (error) {
        console.error('Error logging staff activity:', error);
    }
};

/**
 * Activity tracking helper for manual use in controllers (user)
 */
const logUserActivity = async (req, actionType, description, entityType = null, entityId = null) => {
    if (!req.user || req.user.role !== 'user') {
        return;
    }

    try {
        const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        await UserActivity.logActivity({
            userId: req.user.id,
            actionType,
            actionDescription: description,
            entityType,
            entityId,
            ipAddress,
            userAgent
        });
    } catch (error) {
        console.error('Error logging user activity:', error);
    }
};

module.exports = { trackActivity, logStaffActivity, logUserActivity };
