const bcrypt = require('bcryptjs');
const db = require('../config/database');

class AdminMasterKey {
    static isEnabled(value) {
        return value === true || value === 1 || value === '1' || value === 'true';
    }

    static async getStatus(adminId) {
        const [rows] = await db.query('SELECT enabled FROM admin_master_keys WHERE admin_id = ?', [adminId]);
        return rows[0] ? { configured: true, enabled: AdminMasterKey.isEnabled(rows[0].enabled) } : { configured: false, enabled: false };
    }

    static async verify(adminId, masterKey, allowDisabled = false) {
        const [rows] = await db.query('SELECT key_hash, enabled FROM admin_master_keys WHERE admin_id = ?', [adminId]);
        if (!rows[0] || (!allowDisabled && !AdminMasterKey.isEnabled(rows[0].enabled)) || typeof masterKey !== 'string') return false;
        return bcrypt.compare(masterKey, rows[0].key_hash);
    }

    static async create(adminId, masterKey) {
        const hash = await bcrypt.hash(masterKey, 12);
        await db.query(
            `INSERT INTO admin_master_keys (admin_id, key_hash, enabled)
             VALUES (?, ?, TRUE)
             ON DUPLICATE KEY UPDATE key_hash = VALUES(key_hash), enabled = TRUE, updated_at = NOW()`,
            [adminId, hash]
        );
    }

    static async change(adminId, masterKey) {
        const hash = await bcrypt.hash(masterKey, 12);
        const [result] = await db.query(
            'UPDATE admin_master_keys SET key_hash = ?, enabled = TRUE, updated_at = NOW() WHERE admin_id = ?',
            [hash, adminId]
        );
        return result.affectedRows > 0;
    }

    static async setEnabled(adminId, enabled) {
        const [result] = await db.query(
            'UPDATE admin_master_keys SET enabled = ?, updated_at = NOW() WHERE admin_id = ?',
            [Boolean(enabled), adminId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = AdminMasterKey;
