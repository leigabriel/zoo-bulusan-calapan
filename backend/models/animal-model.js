const db = require('../config/database');

class Animal {
    static async getAll() {
        const [rows] = await db.query(
            'SELECT * FROM animals ORDER BY name ASC'
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM animals WHERE id = ?', [id]);
        return rows[0];
    }

    static async findBySpecies(species) {
        const [rows] = await db.query(
            'SELECT * FROM animals WHERE species = ? ORDER BY name ASC',
            [species]
        );
        return rows;
    }

    static async create(animalData) {
        const { name, species, exhibit, description, imageUrl, status } = animalData;
        const [result] = await db.query(
            'INSERT INTO animals (name, species, habitat, description, image_url, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, species, exhibit, description || null, imageUrl || null, status || 'healthy']
        );
        return result.insertId;
    }

    static async update(id, animalData) {
        const { name, species, exhibit, description, imageUrl, status } = animalData;
        const [result] = await db.query(
            'UPDATE animals SET name = ?, species = ?, habitat = ?, description = ?, image_url = ?, status = ? WHERE id = ?',
            [name, species, exhibit, description, imageUrl, status, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM animals WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async count() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM animals');
        return rows[0].total;
    }

    static async countByStatus(status) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM animals WHERE status = ?',
            [status]
        );
        return rows[0].total;
    }

    static async getByExhibit(exhibit) {
        const [rows] = await db.query(
            'SELECT * FROM animals WHERE habitat = ? ORDER BY name ASC',
            [exhibit]
        );
        return rows;
    }

    static async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE animals SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Animal;