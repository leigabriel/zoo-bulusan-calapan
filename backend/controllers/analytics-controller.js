const crypto = require('crypto');
const db = require('../config/database');

const hashVisitorKey = (visitorKey, req) => crypto.createHash('sha256')
    .update(`${visitorKey}|${req.ip}|${req.get('user-agent') || ''}`)
    .digest('hex');

exports.recordVisit = async (req, res) => {
    const visitorKey = typeof req.body?.visitorKey === 'string' ? req.body.visitorKey.trim() : '';
    const path = typeof req.body?.path === 'string' ? req.body.path.slice(0, 255) : '/';

    if (!visitorKey || visitorKey.length > 128) {
        return res.status(400).json({ success: false, message: 'A valid visitor key is required.' });
    }

    try {
        const visitorHash = hashVisitorKey(visitorKey, req);
        await db.query(
            `INSERT IGNORE INTO site_visits (visitor_key_hash, visit_date, path, user_id)
             VALUES (?, CURDATE(), ?, ?)`,
            [visitorHash, path || '/', req.user?.id || null]
        );
        return res.status(202).json({ success: true });
    } catch (error) {
        console.error('Error recording site visit:', error.message);
        return res.status(202).json({ success: true });
    }
};