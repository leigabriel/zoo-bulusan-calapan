module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    roles: {
        ADMIN: 'admin',
        STAFF: 'staff',
        VET: 'vet',
        USER: 'user'
    },
    ticketTypes: {
        ADULT: { name: 'adult', price: 150 },
        CHILD: { name: 'child', price: 100 },
        SENIOR: { name: 'senior', price: 120 },
        FAMILY: { name: 'family', price: 450 }
    },
    animalStatus: ['healthy', 'sick', 'critical', 'quarantine'],
    ticketStatus: ['active', 'used', 'expired', 'cancelled']
};