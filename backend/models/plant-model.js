const db = require('../config/database');

// Maps the camelCase fields used by the controllers to their database columns.
// Keeping this list in one place lets update() touch only the fields a caller
// actually provided, so a partial edit cannot wipe the rest of the record.
const PLANT_COLUMNS = {
    name: 'name',
    scientificName: 'scientific_name',
    category: 'category',
    description: 'description',
    habitat: 'habitat',
    origin: 'origin',
    careLevel: 'care_level',
    sunlightRequirement: 'sunlight_requirement',
    waterRequirement: 'water_requirement',
    height: 'height',
    bloomSeason: 'bloom_season',
    isEndangered: 'is_endangered',
    imageUrl: 'image_url',
    status: 'status',
    location: 'location',
    arrivalDate: 'arrival_date',
};

class Plant {
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM plants WHERE (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY name ASC'
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM plants WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByCategory(category) {
        const [rows] = await db.query(
            'SELECT * FROM plants WHERE category = ? AND (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY name ASC',
            [category]
        );
        return rows;
    }

    static async create(plantData) {
        const { 
            name, scientificName, category, description, habitat, origin,
            careLevel, sunlightRequirement, waterRequirement, height,
            bloomSeason, isEndangered, imageUrl, status, location, arrivalDate
        } = plantData;
        
        const [result] = await db.query(
            `INSERT INTO plants (name, scientific_name, category, description, habitat, origin,
                care_level, sunlight_requirement, water_requirement, height,
                bloom_season, is_endangered, image_url, status, location, arrival_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, scientificName || null, category || 'trees', description || null,
                habitat || null, origin || null, careLevel || 'moderate',
                sunlightRequirement || 'partial_shade', waterRequirement || 'moderate',
                height || null, bloomSeason || null, isEndangered || false,
                imageUrl || null, status || 'healthy', location || null, arrivalDate || null
            ]
        );
        return result.insertId;
    }

    static async update(id, plantData) {
        const assignments = [];
        const values = [];

        for (const [field, column] of Object.entries(PLANT_COLUMNS)) {
            if (plantData[field] !== undefined) {
                assignments.push(`${column} = ?`);
                values.push(plantData[field]);
            }
        }

        if (assignments.length === 0) return false;

        values.push(id);
        const [result] = await db.query(
            `UPDATE plants SET ${assignments.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM plants WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async count() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM plants WHERE (is_deleted IS NULL OR is_deleted = FALSE)');
        return rows[0].total;
    }

    static async countByStatus(status) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM plants WHERE status = ? AND (is_deleted IS NULL OR is_deleted = FALSE)',
            [status]
        );
        return rows[0].total;
    }

    static async countByCategory(category) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM plants WHERE category = ? AND (is_deleted IS NULL OR is_deleted = FALSE)',
            [category]
        );
        return rows[0].total;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE plants SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async getByLocation(location) {
        const [rows] = await db.query(
            'SELECT * FROM plants WHERE location = ? AND (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY name ASC',
            [location]
        );
        return rows;
    }

    static async getEndangered() {
        const [rows] = await db.query(
            'SELECT * FROM plants WHERE is_endangered = TRUE AND (is_deleted IS NULL OR is_deleted = FALSE) ORDER BY name ASC'
        );
        return rows;
    }

    // Trash methods
    static async softDelete(id, deletedBy) {
        const [result] = await db.query(
            'UPDATE plants SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ? WHERE id = ?',
            [deletedBy, id]
        );
        return result.affectedRows > 0;
    }

    static async softDeleteMultiple(ids, deletedBy) {
        if (!ids || ids.length === 0) return false;
        const [result] = await db.query(
            'UPDATE plants SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ? WHERE id IN (?)',
            [deletedBy, ids]
        );
        return result.affectedRows > 0;
    }

    static async restore(id) {
        const [result] = await db.query(
            'UPDATE plants SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL WHERE id = ?',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async restoreMultiple(ids) {
        if (!ids || ids.length === 0) return false;
        const [result] = await db.query(
            'UPDATE plants SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL WHERE id IN (?)',
            [ids]
        );
        return result.affectedRows > 0;
    }

    static async getDeleted() {
        const [rows] = await db.query(
            `SELECT p.*, CONCAT(d.first_name, ' ', d.last_name) as deleted_by_name
             FROM plants p
             LEFT JOIN users d ON p.deleted_by = d.id
             WHERE p.is_deleted = TRUE
             ORDER BY p.deleted_at DESC`
        );
        return rows;
    }

    static async permanentDelete(id) {
        const [result] = await db.query('DELETE FROM plants WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async permanentDeleteMultiple(ids) {
        if (!ids || ids.length === 0) return false;
        const [result] = await db.query('DELETE FROM plants WHERE id IN (?)', [ids]);
        return result.affectedRows > 0;
    }
}

module.exports = Plant;
