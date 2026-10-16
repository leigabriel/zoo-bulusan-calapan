// Secrets live in config/secrets.js, which fails fast when JWT_SECRET is
// missing or is a known placeholder. Re-exported here so existing importers
// of this module keep working.
const { jwtSecret, jwtExpire, reservationQrSecret } = require('./secrets');

module.exports = {
    jwtSecret,
    jwtExpire,
    reservationQrSecret,
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
