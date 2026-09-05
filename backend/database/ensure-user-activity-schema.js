const db = require('../config/database');

const ensureUserActivitySchema = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS user_activity_logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            action_type VARCHAR(64) NOT NULL,
            action_description TEXT DEFAULT NULL,
            entity_type VARCHAR(50) DEFAULT NULL,
            entity_id INT DEFAULT NULL,
            source_key VARCHAR(150) DEFAULT NULL,
            actor_name VARCHAR(201) DEFAULT NULL,
            actor_email VARCHAR(255) DEFAULT NULL,
            ip_address VARCHAR(45) DEFAULT NULL,
            user_agent TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_user_activity_source (source_key),
            INDEX idx_user_activity_user_id (user_id),
            INDEX idx_user_activity_action_type (action_type),
            INDEX idx_user_activity_created_at (created_at),
            CONSTRAINT fk_user_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [columns] = await db.query(`
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_activity_logs'
    `);
    const columnNames = new Set(columns.map(column => column.COLUMN_NAME));
    if (!columnNames.has('source_key')) {
        await db.query(`ALTER TABLE user_activity_logs ADD COLUMN source_key VARCHAR(150) DEFAULT NULL AFTER entity_id`);
        await db.query(`ALTER TABLE user_activity_logs ADD UNIQUE KEY uk_user_activity_source (source_key)`);
    }
    if (!columnNames.has('actor_name')) {
        await db.query(`ALTER TABLE user_activity_logs ADD COLUMN actor_name VARCHAR(201) DEFAULT NULL AFTER source_key`);
    }
    if (!columnNames.has('actor_email')) {
        await db.query(`ALTER TABLE user_activity_logs ADD COLUMN actor_email VARCHAR(255) DEFAULT NULL AFTER actor_name`);
    }
    await db.query(`ALTER TABLE user_activity_logs MODIFY action_type VARCHAR(64) NOT NULL`);
    await db.query(`
        UPDATE user_activity_logs ual
        JOIN users u ON u.id = ual.user_id
        SET ual.actor_name = COALESCE(ual.actor_name, CONCAT(u.first_name, ' ', u.last_name)),
            ual.actor_email = COALESCE(ual.actor_email, u.email)
    `);

    const [foreignKeys] = await db.query(`
        SELECT rc.CONSTRAINT_NAME, rc.DELETE_RULE
        FROM information_schema.REFERENTIAL_CONSTRAINTS rc
        JOIN information_schema.KEY_COLUMN_USAGE kcu
          ON kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
         AND kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
         AND kcu.TABLE_NAME = rc.TABLE_NAME
        WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
          AND rc.TABLE_NAME = 'user_activity_logs'
          AND kcu.COLUMN_NAME = 'user_id'
    `);
    for (const foreignKey of foreignKeys) {
        if (foreignKey.DELETE_RULE !== 'SET NULL') {
            await db.query(`ALTER TABLE user_activity_logs DROP FOREIGN KEY \`${foreignKey.CONSTRAINT_NAME}\``);
        }
    }
    await db.query(`ALTER TABLE user_activity_logs MODIFY user_id INT NULL`);
    const [remainingForeignKeys] = await db.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND TABLE_NAME = 'user_activity_logs'
          AND COLUMN_NAME = 'user_id'
          AND REFERENCED_TABLE_NAME = 'users'
    `);
    if (remainingForeignKeys.length === 0) {
        await db.query(`
            ALTER TABLE user_activity_logs
            ADD CONSTRAINT fk_user_activity_user
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
        `);
    }

    // Ensure staff_activity_logs uses VARCHAR(64) instead of ENUM so new
    // action types don't silently fail.
    const [staffColumns] = await db.query(`
        SELECT COLUMN_TYPE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'staff_activity_logs'
          AND COLUMN_NAME = 'action_type'
    `);
    if (staffColumns.length > 0 && staffColumns[0].COLUMN_TYPE.startsWith('enum')) {
        await db.query(`ALTER TABLE staff_activity_logs MODIFY action_type VARCHAR(64) NOT NULL`);
    }

    // Backfill only actions that can be proven from persisted records.
    await db.query(`
        INSERT IGNORE INTO user_activity_logs
            (user_id, action_type, action_description, entity_type, entity_id, source_key, actor_name, actor_email, created_at)
        SELECT id, 'register', 'Created an account',
               'user', id, CONCAT('register:user:', id), CONCAT(first_name, ' ', last_name), email, created_at
        FROM users
        WHERE role = 'user'
    `);
    await db.query(`
        INSERT IGNORE INTO user_activity_logs
            (user_id, action_type, action_description, entity_type, entity_id, source_key, actor_name, actor_email, created_at)
        SELECT tr.user_id, 'ticket_reservation',
               'Reserved a ticket',
               'ticket_reservation', tr.id, CONCAT('ticket_reservation:ticket_reservation:', tr.id),
               CONCAT(u.first_name, ' ', u.last_name), u.email, tr.created_at
        FROM ticket_reservations tr
        JOIN users u ON u.id = tr.user_id
        WHERE tr.user_id IS NOT NULL
    `);
    await db.query(`
        INSERT IGNORE INTO user_activity_logs
            (user_id, action_type, action_description, entity_type, entity_id, source_key, actor_name, actor_email, created_at)
        SELECT er.user_id, 'event_reservation',
               'Reserved an event',
               'event_reservation', er.id, CONCAT('event_reservation:event_reservation:', er.id),
               CONCAT(u.first_name, ' ', u.last_name), u.email, er.created_at
        FROM event_reservations er
        JOIN users u ON u.id = er.user_id
        WHERE er.user_id IS NOT NULL
    `);
    await db.query(`
        INSERT IGNORE INTO user_activity_logs
            (user_id, action_type, action_description, entity_type, entity_id, source_key, actor_name, actor_email, created_at)
        SELECT um.sender_id, 'message_sent', 'Sent a message',
               'message', um.id, CONCAT('message_sent:message:', um.id),
               CONCAT(u.first_name, ' ', u.last_name), u.email, um.created_at
        FROM user_messages um
        JOIN users u ON u.id = um.sender_id AND u.role = 'user'
        WHERE um.sender_type = 'user'
    `);
};

module.exports = ensureUserActivitySchema;
