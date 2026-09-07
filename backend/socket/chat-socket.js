const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const db = require('../config/database');
const { encodePublicId } = require('../middleware/public-identifiers');

let io;

const publicPayload = (value, key = '') => {
    if (value instanceof Date) return value;
    if ((key === 'id' || key.endsWith('Id') || key.endsWith('_id')) && value != null && /^\d+$/.test(String(value))) {
        return encodePublicId(value);
    }
    if (Array.isArray(value)) return value.map(item => publicPayload(item));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, publicPayload(child, childKey)]));
};

const participantRooms = conversation => [
    `user:${conversation.user_id}`,
    conversation.recipient_type === 'admin'
        ? 'role:admin'
        : `user:${conversation.staff_recipient_id}`
];

const emitToRooms = (rooms, event, payload) => {
    if (!io) return;
    rooms.reduce((target, room) => target.to(room), io).emit(event, publicPayload(payload));
};

const initializeChatSocket = (httpServer, corsOptions) => {
    io = new Server(httpServer, { cors: corsOptions });
    io.use(async (socket, next) => {
        try {
            const authorization = socket.handshake.headers.authorization || '';
            const suppliedToken = socket.handshake.auth?.token
                || (authorization.startsWith('Bearer ') ? authorization.slice(7) : null);
            const token = suppliedToken?.startsWith('Bearer ') ? suppliedToken.slice(7) : suppliedToken;
            if (!token) return next(new Error('Authentication required'));
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const [rows] = await db.query(
                `SELECT id, role FROM users WHERE id = ? AND role IN ('user', 'staff', 'admin')
                 AND is_active = TRUE AND is_suspended = FALSE
                 AND (is_deleted IS NULL OR is_deleted = FALSE)`,
                [decoded.id]
            );
            if (!rows.length) return next(new Error('Authentication failed'));
            socket.user = rows[0];
            return next();
        } catch (error) {
            return next(new Error('Authentication failed'));
        }
    });
    io.on('connection', socket => {
        socket.join(`user:${socket.user.id}`);
        if (socket.user.role === 'admin') socket.join('role:admin');
        socket.emit('chat:ready', { authenticated: true });
    });
    return io;
};

const emitConversationUpdated = (conversation, payload = conversation) => {
    emitToRooms(participantRooms(conversation), 'chat:conversation-updated', payload);
};

const emitMessageCreated = (conversation, message) => {
    emitToRooms(participantRooms(conversation), 'chat:message-created', message);
};

const emitConversationRead = (conversation, actor, markedRead) => {
    emitToRooms(participantRooms(conversation), 'chat:conversation-read', {
        conversationId: conversation.id,
        readBy: { id: actor.id, role: actor.role },
        markedRead
    });
};

const emitUnreadCount = (actor, count) => {
    const rooms = actor.role === 'admin' ? ['role:admin'] : [`user:${actor.id}`];
    emitToRooms(rooms, 'chat:unread-count-changed', { count });
};

module.exports = {
    initializeChatSocket,
    emitConversationUpdated,
    emitMessageCreated,
    emitConversationRead,
    emitUnreadCount
};
