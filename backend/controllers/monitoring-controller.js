const StaffActivity = require('../models/staff-activity-model');
const User = require('../models/user-model');

/**
 * Get all active staff sessions (who is currently online)
 */
exports.getActiveSessions = async (req, res) => {
    try {
        const sessions = await StaffActivity.getActiveSessions();
        
        // Add online status based on last activity (5 min threshold)
        const sessionsWithStatus = sessions.map(session => ({
            ...session,
            status: session.inactive_minutes < 5 ? 'active' : 
                   session.inactive_minutes < 15 ? 'away' : 'idle'
        }));

        res.json({
            success: true,
            sessions: sessionsWithStatus,
            onlineCount: sessionsWithStatus.filter(s => s.status === 'active').length,
            totalSessions: sessionsWithStatus.length
        });
    } catch (error) {
        console.error('Error getting active sessions:', error);
        res.status(500).json({ success: false, message: 'Error fetching active sessions' });
    }
};

/**
 * Get recent staff activities
 */
exports.getRecentActivities = async (req, res) => {
    try {
        const { limit = 50, staffId, actionType, startDate, endDate } = req.query;
        
        const activities = await StaffActivity.getRecentActivities({
            limit: parseInt(limit),
            staffId: staffId ? parseInt(staffId) : null,
            actionType,
            startDate,
            endDate
        });

        res.json({
            success: true,
            activities,
            count: activities.length
        });
    } catch (error) {
        console.error('Error getting recent activities:', error);
        res.status(500).json({ success: false, message: 'Error fetching activities' });
    }
};

/**
 * Get staff statistics and performance overview
 */
exports.getStaffStats = async (req, res) => {
    try {
        const [staffStats, activitySummary, dailyActivity] = await Promise.all([
            StaffActivity.getStaffStats(),
            StaffActivity.getActivitySummary(null, 7),
            StaffActivity.getDailyActivityCounts(7)
        ]);

        // Transform activity summary into object
        const summaryMap = {};
        activitySummary.forEach(item => {
            summaryMap[item.action_type] = item.count;
        });

        res.json({
            success: true,
            data: {
                staff: staffStats.map(s => ({
                    id: s.id,
                    firstName: s.first_name,
                    lastName: s.last_name,
                    fullName: `${s.first_name} ${s.last_name}`,
                    email: s.email,
                    role: s.role,
                    profileImage: s.profile_image,
                    lastLogin: s.last_login_at,
                    isOnline: s.is_online === 1,
                    totalActions: s.total_actions,
                    actionsThisWeek: s.actions_this_week,
                    messagesReplied: s.messages_replied,
                    reservationsHandled: s.reservations_handled,
                    joinedAt: s.created_at
                })),
                summary: {
                    totalLogins: summaryMap['login'] || 0,
                    totalLogouts: summaryMap['logout'] || 0,
                    messageReplies: summaryMap['message_reply'] || 0,
                    reservationUpdates: summaryMap['reservation_update'] || 0,
                    ticketUpdates: summaryMap['ticket_update'] || 0,
                    animalUpdates: summaryMap['animal_update'] || 0,
                    plantUpdates: summaryMap['plant_update'] || 0,
                    eventUpdates: summaryMap['event_update'] || 0,
                    userUpdates: summaryMap['user_update'] || 0
                },
                dailyActivity: dailyActivity.map(d => ({
                    date: d.date,
                    activityCount: d.count,
                    activeStaff: d.active_staff
                }))
            }
        });
    } catch (error) {
        console.error('Error getting staff stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching staff statistics' });
    }
};

/**
 * Get specific staff member's activity timeline
 */
exports.getStaffTimeline = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { limit = 20 } = req.query;

        const [timeline, user] = await Promise.all([
            StaffActivity.getStaffTimeline(parseInt(staffId), parseInt(limit)),
            User.findById(parseInt(staffId))
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        res.json({
            success: true,
            staff: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role,
                profileImage: user.profile_image
            },
            timeline
        });
    } catch (error) {
        console.error('Error getting staff timeline:', error);
        res.status(500).json({ success: false, message: 'Error fetching timeline' });
    }
};

/**
 * Get monitoring dashboard overview
 */
exports.getMonitoringDashboard = async (req, res) => {
    try {
        const [
            activeSessions,
            recentActivities,
            staffStats,
            dailyActivity
        ] = await Promise.all([
            StaffActivity.getActiveSessions(),
            StaffActivity.getRecentActivities({ limit: 20 }),
            StaffActivity.getStaffStats(),
            StaffActivity.getDailyActivityCounts(7)
        ]);

        // Calculate online/offline counts
        const onlineStaff = activeSessions.filter(s => {
            return s.inactive_minutes < 15;
        });

        res.json({
            success: true,
            data: {
                overview: {
                    totalStaff: staffStats.length,
                    onlineNow: onlineStaff.length,
                    totalActivities: recentActivities.length
                },
                activeSessions: activeSessions.map(s => ({
                    ...s,
                    status: s.inactive_minutes < 5 ? 'active' : 
                           s.inactive_minutes < 15 ? 'away' : 'idle'
                })),
                recentActivities: recentActivities.slice(0, 10),
                staffMembers: staffStats.map(s => ({
                    id: s.id,
                    firstName: s.first_name,
                    lastName: s.last_name,
                    email: s.email,
                    role: s.role,
                    profileImage: s.profile_image,
                    isOnline: s.is_online === 1,
                    actionsThisWeek: s.actions_this_week
                })),
                dailyActivity
            }
        });
    } catch (error) {
        console.error('Error getting monitoring dashboard:', error);
        res.status(500).json({ success: false, message: 'Error fetching monitoring data' });
    }
};

/**
 * Heartbeat endpoint for staff to report activity
 */
exports.heartbeat = async (req, res) => {
    try {
        if (req.user && ['staff', 'admin'].includes(req.user.role)) {
            await StaffActivity.updateSessionActivity(req.user.id);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error processing heartbeat:', error);
        res.status(500).json({ success: false });
    }
};
