const db = require('../config/database');

class Plant {
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM plants ORDER BY name ASC'
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM plants WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByCategory(category) {
        const [rows] = await db.query(
            'SELECT * FROM plants WHERE category = ? ORDER BY name ASC',
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
        const { 
            name, scientificName, category, description, habitat, origin,
            careLevel, sunlightRequirement, waterRequirement, height,
            bloomSeason, isEndangered, imageUrl, status, location, arrivalDate
        } = plantData;
        
        const [result] = await db.query(
            `UPDATE plants SET name = ?, scientific_name = ?, category = ?, description = ?,
                habitat = ?, origin = ?, care_level = ?, sunlight_requirement = ?,
                water_requirement = ?, height = ?, bloom_season = ?, is_endangered = ?,
                image_url = ?, status = ?, location = ?, arrival_date = ?
             WHERE id = ?`,
            [
                name, scientificName, category, description, habitat, origin,
                careLevel, sunlightRequirement, waterRequirement, height,
                bloomSeason, isEndangered, imageUrl, status, location, arrivalDate, id
            ]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM plants WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async count() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM plants');
        return rows[0].total;
    }

    static async countByStatus(status) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM plants WHERE status = ?',
            [status]
        );
        return rows[0].total;
    }

    static async countByCategory(category) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM plants WHERE category = ?',
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
            'SELECT * FROM plants WHERE location = ? ORDER BY name ASC',
            [location]
        );
        return rows;
    }

    static async getEndangered() {
        const [rows] = await db.query(
            'SELECT * FROM plants WHERE is_endangered = TRUE ORDER BY name ASC'
        );
        return rows;
    }
}

module.exports = Plant;
