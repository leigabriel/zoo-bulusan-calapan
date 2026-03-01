const db = require('../config/database');

class Collection {
    // Get user's collection
    static async getByUserId(userId) {
        const [rows] = await db.query(
            `SELECT * FROM user_collections 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [userId]
        );
        return rows;
    }

    // Get a specific collection item
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT * FROM user_collections WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    // Check if animal already exists in user's collection
    static async exists(userId, animalName) {
        const [rows] = await db.query(
            'SELECT id FROM user_collections WHERE user_id = ? AND animal_name = ?',
            [userId, animalName]
        );
        return rows.length > 0;
    }

    // Add animal to collection
    static async add(collectionData) {
        const { userId, animalName, description, category, confidence, capturedImage } = collectionData;
        
        // Check if already exists
        const exists = await this.exists(userId, animalName);
        if (exists) {
            return { success: false, message: 'Animal already in collection' };
        }

        const [result] = await db.query(
            `INSERT INTO user_collections (user_id, animal_name, description, category, confidence, captured_image)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, animalName, description || null, category || null, confidence || 0, capturedImage || null]
        );
        
        return { success: true, id: result.insertId };
    }

    // Remove animal from collection
    static async remove(id, userId) {
        const [result] = await db.query(
            'DELETE FROM user_collections WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    // Count user's collection
    static async countByUserId(userId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM user_collections WHERE user_id = ?',
            [userId]
        );
        return rows[0]?.count || 0;
    }

    // Get collection stats for user
    static async getStats(userId) {
        const [rows] = await db.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT category) as categories,
                MAX(created_at) as lastAdded
             FROM user_collections 
             WHERE user_id = ?`,
            [userId]
        );
        return rows[0] || { total: 0, categories: 0, lastAdded: null };
    }
}

module.exports = Collection;
