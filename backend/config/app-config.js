module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    roles: {
        ADMIN: 'admin',
        STAFF: 'staff',
        USER: 'user'
    },
    ticketTypes: {
        ADULT: { name: 'adult', price: 40 },
        CHILD: { name: 'child', price: 20 },
        RESIDENT: { name: 'resident', price: 'free' }
    },
    animalStatus: ['healthy', 'sick', 'critical', 'quarantine'],
    ticketStatus: ['active', 'used', 'expired', 'cancelled']
};