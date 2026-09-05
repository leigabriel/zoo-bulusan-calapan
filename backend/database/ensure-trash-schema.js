const db = require('../config/database');

const ensureTrashSchema = async () => {
    const tables = ['users', 'animals', 'plants', 'events'];

    for (const table of tables) {
        const [columns] = await db.query(`
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
        `, [table]);
        const columnNames = new Set(columns.map(c => c.COLUMN_NAME));

        if (!columnNames.has('is_deleted')) {
            await db.query(`ALTER TABLE ${table} ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE`);
        }
        if (!columnNames.has('deleted_at')) {
            await db.query(`ALTER TABLE ${table} ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL`);
        }
        if (!columnNames.has('deleted_by')) {
            await db.query(`ALTER TABLE ${table} ADD COLUMN deleted_by INT DEFAULT NULL`);
        }

        // Add index for is_deleted if not exists
        const [indexes] = await db.query(`
            SELECT INDEX_NAME FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
        `, [table, `idx_${table}_is_deleted`]);
        if (indexes.length === 0) {
            await db.query(`CREATE INDEX idx_${table}_is_deleted ON ${table} (is_deleted)`);
        }
    }

    // Add foreign key constraints for deleted_by (ignore errors if already exists)
    const fkStatements = [
        'ALTER TABLE users ADD CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE',
        'ALTER TABLE animals ADD CONSTRAINT fk_animals_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE',
        'ALTER TABLE plants ADD CONSTRAINT fk_plants_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE',
        'ALTER TABLE events ADD CONSTRAINT fk_events_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE'
    ];

    for (const stmt of fkStatements) {
        try {
            await db.query(stmt);
        } catch (err) {
            // Constraint may already exist, ignore duplicate key errors
            if (err.code !== 'ER_DUP_KEYNAME' && !err.message.includes('Duplicate')) {
                console.error('FK constraint error:', err.message);
            }
        }
    }

    console.log('Trash schema ensured successfully');
};

module.exports = ensureTrashSchema;
