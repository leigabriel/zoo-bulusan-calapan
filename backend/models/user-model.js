const db = require('../config/database');

class User {
    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    }

    static async findByEmailOrUsername(identifier) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [identifier, identifier]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT id, first_name, last_name, username, email, phone_number, gender, birthday, 
             role, profile_image, is_active, email_verified, created_at, updated_at 
             FROM users WHERE id = ?`,
            [id]
        );
        return rows[0];
    }

    static async create(userData) {
        const { 
            firstName, lastName, username, email, phoneNumber, 
            gender, birthday, password, role 
        } = userData;
        
        const [result] = await db.query(
            `INSERT INTO users (first_name, last_name, username, email, phone_number, gender, birthday, password, role) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [firstName, lastName, username, email, phoneNumber || null, gender || 'prefer_not_to_say', birthday || null, password, role || 'user']
        );
        return result.insertId;
    }

    static async getAll() {
        const [rows] = await db.query(
            `SELECT id, first_name, last_name, username, email, phone_number, gender, birthday, 
             role, profile_image, is_active, created_at 
             FROM users ORDER BY created_at DESC`
        );
        return rows;
    }

    static async getByRole(role) {
        const [rows] = await db.query(
            `SELECT id, first_name, last_name, username, email, phone_number, role, is_active, created_at 
             FROM users WHERE role = ? ORDER BY created_at DESC`,
            [role]
        );
        return rows;
    }

    static async update(id, userData) {
        const { firstName, lastName, username, email, phoneNumber, gender, birthday, role } = userData;
        const [result] = await db.query(
            `UPDATE users SET first_name = ?, last_name = ?, username = ?, email = ?, 
             phone_number = ?, gender = ?, birthday = ?, role = ?, updated_at = NOW() WHERE id = ?`,
            [firstName, lastName, username, email, phoneNumber, gender, birthday, role, id]
        );
        return result.affectedRows > 0;
    }

    static async updateProfile(id, profileData) {
        const { firstName, lastName, phoneNumber, gender, birthday, profileImage } = profileData;
        const [result] = await db.query(
            `UPDATE users SET first_name = ?, last_name = ?, phone_number = ?, 
             gender = ?, birthday = ?, profile_image = ?, updated_at = NOW() WHERE id = ?`,
            [firstName, lastName, phoneNumber, gender, birthday, profileImage, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async updatePassword(id, newPassword) {
        const [result] = await db.query(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [newPassword, id]
        );
        return result.affectedRows > 0;
    }

    static async count() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM users');
        return rows[0].total;
    }

    static async countByRole(role) {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = ?', [role]);
        return rows[0].total;
    }

    static async setActive(id, isActive) {
        const [result] = await db.query(
            'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [isActive, id]
        );
        return result.affectedRows > 0;
    }

    static async verifyEmail(id) {
        const [result] = await db.query(
            'UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = User;
