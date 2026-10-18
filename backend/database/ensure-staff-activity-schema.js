const db = require('../config/database');

/**
 * Snapshot columns plus a non-destructive foreign key for staff_activity_logs.
 *
 * staff_activity_logs.staff_id was declared NOT NULL with ON DELETE CASCADE, so
 * removing an admin or staff account silently destroyed every action that person
 * had ever performed. user_activity_logs already survived this (SET NULL plus an
 * actor snapshot, see ensure-user-activity-schema.js); staff logs now match.
 *
 * Idempotent: re-running only changes what is still wrong.
 */
const snapshotColumns = {
    actor_name: 'VARCHAR(201) DEFAULT NULL',
    actor_email: 'VARCHAR(255) DEFAULT NULL',
    actor_role: 'VARCHAR(20) DEFAULT NULL'
};

const ensureStaffActivitySchema = async () => {
    const [columns] = await db.query(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_activity_logs'
    `);
    if (columns.length === 0) {
        // Table is created by the main schema file; nothing to harden yet.
        return;
    }

    const columnNames = new Set(columns.map(column => column.COLUMN_NAME));
    for (const [name, definition] of Object.entries(snapshotColumns)) {
        if (!columnNames.has(name)) {
            await db.query(`ALTER TABLE staff_activity_logs ADD COLUMN ${name} ${definition} AFTER entity_id`);
        }
    }

    // Snapshot who performed each existing action before the join can be lost.
    await db.query(`
        UPDATE staff_activity_logs sal
        JOIN users u ON u.id = sal.staff_id
        SET sal.actor_name = COALESCE(sal.actor_name, CONCAT(u.first_name, ' ', u.last_name)),
            sal.actor_email = COALESCE(sal.actor_email, u.email),
            sal.actor_role = COALESCE(sal.actor_role, u.role)
        WHERE sal.actor_name IS NULL OR sal.actor_email IS NULL OR sal.actor_role IS NULL
    `);

    const [foreignKeys] = await db.query(`
        SELECT rc.CONSTRAINT_NAME, rc.DELETE_RULE
        FROM information_schema.REFERENTIAL_CONSTRAINTS rc
        JOIN information_schema.KEY_COLUMN_USAGE kcu
          ON kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
         AND kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
         AND kcu.TABLE_NAME = rc.TABLE_NAME
        WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
          AND rc.TABLE_NAME = 'staff_activity_logs'
          AND kcu.COLUMN_NAME = 'staff_id'
    `);

    // CASCADE (or any rule other than SET NULL) deletes the trail; replace it.
    const mustRecreate = foreignKeys.some(foreignKey => foreignKey.DELETE_RULE !== 'SET NULL');
    if (mustRecreate) {
        for (const foreignKey of foreignKeys) {
            await db.query(`ALTER TABLE staff_activity_logs DROP FOREIGN KEY \`${foreignKey.CONSTRAINT_NAME}\``);
        }
    }

    await db.query('ALTER TABLE staff_activity_logs MODIFY staff_id INT NULL');

    if (mustRecreate || foreignKeys.length === 0) {
        await db.query(`
            ALTER TABLE staff_activity_logs
            ADD CONSTRAINT fk_staff_activity_staff
            FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
        `);
    }
};

module.exports = ensureStaffActivitySchema;