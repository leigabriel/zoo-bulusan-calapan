const StaffActivity = require('../models/staff-activity-model');

/**
 * Middleware to track staff activities
 * Usage: router.post('/endpoint', trackActivity('action_type', 'description'), controller)
 */
const trackActivity = (actionType, getDescription = null) => {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);
        
        res.json = async function(data) {
            // Only track if the request was successful and user is staff/admin
            if (data.success && req.user && ['staff', 'admin'].includes(req.user.role)) {
                try {
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
                    
                    // Determine entity info from request params
                    let entityType = null;
                    let entityId = null;
                    
                    if (req.params.id) {
                        entityId = parseInt(req.params.id);
                    }
                    
                    // Try to infer entity type from URL
                    const path = req.path.toLowerCase();
                    if (path.includes('animal')) entityType = 'animal';
                    else if (path.includes('plant')) entityType = 'plant';
                    else if (path.includes('event')) entityType = 'event';
                    else if (path.includes('ticket') || path.includes('reservation')) entityType = 'reservation';
                    else if (path.includes('message')) entityType = 'message';
                    else if (path.includes('user')) entityType = 'user';
                    
                    await StaffActivity.logActivity({
                        staffId: req.user.id,
                        actionType,
                        actionDescription: description,
                        entityType,
                        entityId,
                        ipAddress,
                        userAgent
                    });
                    
                    // Also update session activity
                    await StaffActivity.updateSessionActivity(req.user.id);
                } catch (error) {
                    console.error('Error tracking activity:', error);
                    // Don't fail the request if tracking fails
                }
            }
            
            return originalJson(data);
        };
        
        next();
    };
};

/**
 * Activity tracking helper for manual use in controllers
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

module.exports = { trackActivity, logStaffActivity };