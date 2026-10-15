// Canonical definition of the visitor notification preference keys. The database
// column, the settings endpoint and the settings page all derive from this set, so a
// new preference only has to be added here.
//
// `marketing` is a category, not a stored preference key: it gates a notification
// whose delivery additionally requires `marketingEmails === true`.
const CATEGORIES = new Set([
    'emailNotifications',
    'pushNotifications',
    'eventReminders',
    'ticketUpdates',
    'marketingEmails',
    'marketing'
]);

// The five keys persisted in users.notification_settings. `marketing` is deliberately
// absent — it is a delivery gate derived from `marketingEmails`, not a stored value.
const STORED_PREFERENCES = new Set([
    'emailNotifications',
    'pushNotifications',
    'eventReminders',
    'ticketUpdates',
    'marketingEmails'
]);

// Value used for any preference a visitor has never explicitly set. A user row with a
// NULL notification_settings column gets exactly these.
const DEFAULT_SETTINGS = {
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    ticketUpdates: true,
    marketingEmails: false
};

const reference = (data) => data.reference || 'your booking';
const status = (data) => (data.status ? String(data.status).replace(/_/g, ' ') : 'updated');
const kind = (data) => (data.kind === 'event' ? 'Event' : 'Ticket');

/**
 * The catalog is the single source of truth for what a notification is: which
 * preference gates it, whether it emails by default, and its copy.
 *
 * `reminder` marks a type as an actual reminder rather than an announcement. New event
 * announcements set it false so that adding a genuine `event.reminder` type later can
 * be gated independently — previously `type: 'event'` was resolved to the
 * `eventReminders` preference, so switching off reminders silently suppressed
 * announcements as well.
 */
const CATALOG = {
    'event.announced': {
        category: 'eventReminders',
        emailByDefault: true,
        reminder: false,
        title: () => 'New Event Available',
        message: (data) => `${data.title || 'A new event'} is now available at Bulusan Zoo.`
    },
    'event.updated': {
        category: 'eventReminders',
        emailByDefault: true,
        reminder: false,
        title: () => 'Event Updated',
        message: (data) => `${data.title || 'An event'} has been updated. Please check the details.`
    },
    'event.cancelled': {
        category: 'eventReminders',
        emailByDefault: true,
        reminder: false,
        title: () => 'Event Cancelled',
        message: (data) => `${data.title || 'An event'} has been cancelled.`
    },
    // `reservation.*` covers both ticket and event reservations. `data.kind` selects the
    // noun so a visitor is told which one changed; it falls back to "reservation".
    'reservation.confirmed': {
        category: 'ticketUpdates',
        emailByDefault: true,
        reminder: false,
        title: (data) => `${kind(data)} Reservation Confirmed`,
        message: (data) => `Your ${kind(data).toLowerCase()} reservation ${reference(data)} has been confirmed.`
    },
    'reservation.cancelled': {
        category: 'ticketUpdates',
        emailByDefault: true,
        reminder: false,
        title: (data) => `${kind(data)} Reservation Cancelled`,
        message: (data) => `Your ${kind(data).toLowerCase()} reservation ${reference(data)} has been cancelled.${data.reason ? ` Reason: ${data.reason}` : ''}`
    },
    'reservation.completed': {
        category: 'ticketUpdates',
        emailByDefault: true,
        reminder: false,
        title: (data) => `${kind(data)} Reservation Completed`,
        message: (data) => `Your ${kind(data).toLowerCase()} reservation ${reference(data)} is now completed. Thank you for visiting Bulusan Zoo.`
    },
    'reservation.no_show': {
        category: 'ticketUpdates',
        emailByDefault: true,
        reminder: false,
        title: (data) => `${kind(data)} Marked as No Show`,
        message: (data) => `Your ${kind(data).toLowerCase()} reservation ${reference(data)} was marked as a no show.`
    },
    'reservation.verification': {
        category: 'ticketUpdates',
        emailByDefault: true,
        reminder: false,
        title: () => 'Verification Updated',
        message: (data) => `Verification for your reservation ${reference(data)} is now ${status(data)}.`
    },
    'ticket.paid': {
        category: 'ticketUpdates',
        emailByDefault: true,
        reminder: false,
        title: () => 'Payment Confirmed',
        message: (data) => `Payment for ${reference(data)} has been confirmed.${data.status ? ` The payment is now ${status(data)}.` : ''}`
    },
    'ticket.checked_in': {
        category: 'ticketUpdates',
        emailByDefault: true,
        reminder: false,
        title: () => 'Checked In',
        message: (data) => `Your ticket ${reference(data)} has been checked in. Enjoy your visit!`
    },
    'appeal.reviewed': {
        category: null,
        emailByDefault: true,
        reminder: false,
        title: () => 'Appeal Reviewed',
        message: (data) => `Your account appeal was ${status(data)}.${data.response ? ` Response: ${data.response}` : ''}`
    },
    'post.moderated': {
        category: null,
        emailByDefault: true,
        reminder: false,
        // Approval no longer exists, so the old approved/declined split is dead. The key
        // is kept as-is because it is already stored verbatim in notifications.type.
        title: () => 'Your Post Was Removed',
        message: (data) => `A moderator removed your community post because it broke the community guidelines.${data.note ? ` Reason: ${data.note}` : ''}`
    },
    // Confirmation that the visitor's own post reached the feed. Deliberately not email-gated:
    // `post.moderated` is a real event worth an email, but someone telling themselves their own
    // post went live — seconds after watching it happen — is not. `category: null` also keeps it
    // out of the preference gates, so muting every category cannot hide the confirmation that a
    // post actually succeeded.
    'post.published': {
        category: null,
        emailByDefault: false,
        reminder: false,
        title: () => 'Post Posted',
        message: (data) => `Your post was added to the community feed.${data.photos ? ` It went live with ${data.photos} photo${data.photos > 1 ? 's' : ''}.` : ''}`
    },
    'message.replied': {
        category: null,
        emailByDefault: true,
        reminder: false,
        title: () => 'New Message',
        message: (data) => `${data.subject || 'Support'} sent you a new message.`
    },
    'account.password_set': {
        category: null,
        emailByDefault: true,
        reminder: false,
        title: () => 'Password Updated',
        message: () => 'The password on your Bulusan Zoo account was changed. If this was not you, contact us immediately.'
    },
    'marketing.broadcast': {
        category: 'marketing',
        emailByDefault: false,
        reminder: false,
        title: () => 'News from Bulusan Zoo',
        message: (data) => data.message || 'There is new news from Bulusan Zoo.'
    }
};

// Per-entry override for the marketing preference key: DEFAULT_SETTINGS is keyed by the
// five general preferences, and marketing gates on its own additional opt-in.
const MARKETING_CATEGORY = 'marketing';

const resolveNotification = (type, data = {}) => {
    const entry = CATALOG[type];
    if (!entry) {
        throw new Error(`Unknown notification type: ${type}`);
    }
    return {
        category: entry.category,
        emailByDefault: entry.emailByDefault,
        reminder: entry.reminder,
        title: entry.title(data),
        message: entry.message(data)
    };
};

// A visitor row is eligible when it is an active, non-suspended, non-deleted `user`.
const isEligibleRecipient = (row) => Boolean(row)
    && row.role === 'user'
    && Boolean(row.is_active)
    && !Boolean(row.is_suspended)
    && !row.deleted_at;

const selectVisitorRecipients = (rows) => (rows || []).filter(isEligibleRecipient);

// Required lazily so the pure catalog above stays importable without a database
// connection, which is what lets notification-catalog.test.js run under plain node --test.
const getDb = () => require('../config/database');
const getNotificationModel = () => require('../models/notification-model');

/**
 * Send one notification to one visitor, resolving its copy from the catalog.
 *
 * @param {number} userId
 * @param {string} type - catalog key
 * @param {object} [data] - template variables
 * @param {string|null} [link] - in-app destination
 * @returns {Promise<{id: number|null, emailSent: boolean, skipped: boolean}|null>}
 */
const notifyUser = async (userId, type, data = {}, link = null) => {
    if (!userId) return null;
    const resolved = resolveNotification(type, data);
    const Notification = getNotificationModel();
    return Notification.create({
        userId,
        title: resolved.title,
        message: resolved.message,
        type,
        category: resolved.category,
        emailByDefault: resolved.emailByDefault,
        link
    });
};

/**
 * Notify every active admin and staff member. Kept with its original free-form shape:
 * these are operational alerts, not visitor-facing catalog types.
 */
const notifyManagement = async ({ title, message, type = 'info', link = null, category = null }) => {
    try {
        const db = getDb();
        const Notification = getNotificationModel();
        const [recipients] = await db.query(
            `SELECT id, role FROM users WHERE role IN ('admin', 'staff')
             AND is_active = TRUE AND is_suspended = FALSE AND deleted_at IS NULL`
        );
        await Promise.all(recipients.map(recipient => Notification.create({
            userId: recipient.id,
            title,
            message,
            type,
            category,
            link: Notification.managementLink(link, recipient.role)
        })));
    } catch (error) {
        // Notification failures must not turn a saved booking/message into a retry.
        console.error('Error creating management notifications:', error);
    }
};

/**
 * Send a catalog notification to every eligible visitor.
 *
 * @returns {Promise<number>} how many recipients the notification was created for
 */
const broadcastToVisitors = async (type, data = {}, link = null) => {
    try {
        const db = getDb();
        const [rows] = await db.query(
            `SELECT id FROM users WHERE role = 'user' AND is_active = TRUE
             AND is_suspended = FALSE AND deleted_at IS NULL`
        );
        const recipients = selectVisitorRecipients(rows);
        await Promise.all(recipients.map(recipient => notifyUser(recipient.id, type, data, link)));
        return recipients.length;
    } catch (error) {
        console.error('Error broadcasting visitor notification:', error);
        return 0;
    }
};

module.exports = {
    CATALOG,
    CATEGORIES,
    STORED_PREFERENCES,
    DEFAULT_SETTINGS,
    MARKETING_CATEGORY,
    resolveNotification,
    isEligibleRecipient,
    selectVisitorRecipients,
    notifyUser,
    notifyManagement,
    broadcastToVisitors
};