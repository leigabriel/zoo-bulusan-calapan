const db = require('../config/database');

class Community {
    static initialized = false;

    static async initializeTables() {
        if (Community.initialized) return;

        await db.query(`
            CREATE TABLE IF NOT EXISTS community_posts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                image_url VARCHAR(500) DEFAULT NULL,
                image_public_id VARCHAR(255) DEFAULT NULL,
                status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
                moderation_note VARCHAR(255) DEFAULT NULL,
                moderated_by INT DEFAULT NULL,
                moderated_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_community_posts_user (user_id),
                INDEX idx_community_posts_status (status),
                INDEX idx_community_posts_created_at (created_at),
                CONSTRAINT fk_community_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_community_posts_moderated_by FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS community_comments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                post_id INT NOT NULL,
                user_id INT NOT NULL,
                comment_text TEXT NOT NULL,
                is_reported BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_community_comments_post (post_id),
                INDEX idx_community_comments_user (user_id),
                INDEX idx_community_comments_created_at (created_at),
                CONSTRAINT fk_community_comments_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_community_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS community_comment_hearts (
                id INT PRIMARY KEY AUTO_INCREMENT,
                comment_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_community_comment_hearts (comment_id, user_id),
                INDEX idx_community_hearts_comment (comment_id),
                INDEX idx_community_hearts_user (user_id),
                CONSTRAINT fk_community_hearts_comment FOREIGN KEY (comment_id) REFERENCES community_comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_community_hearts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS community_comment_reports (
                id INT PRIMARY KEY AUTO_INCREMENT,
                comment_id INT NOT NULL,
                user_id INT NOT NULL,
                reason VARCHAR(255) NOT NULL,
                status ENUM('pending', 'reviewed', 'dismissed') DEFAULT 'pending',
                reviewed_by INT DEFAULT NULL,
                reviewed_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_community_comment_reports (comment_id, user_id),
                INDEX idx_community_reports_comment (comment_id),
                INDEX idx_community_reports_status (status),
                CONSTRAINT fk_community_reports_comment FOREIGN KEY (comment_id) REFERENCES community_comments(id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_community_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_community_reports_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        Community.initialized = true;
    }

    static async createPost({ userId, content, imageUrl, imagePublicId }) {
        const [result] = await db.query(
            `INSERT INTO community_posts (user_id, content, image_url, image_public_id, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [userId, content, imageUrl || null, imagePublicId || null]
        );
        return result.insertId;
    }

    static async getPostById(postId) {
        const [rows] = await db.query(
            `SELECT p.*, u.first_name, u.last_name, u.username, u.profile_image
             FROM community_posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [postId]
        );
        return rows[0] || null;
    }

    static async getPublicPosts(viewerId = null) {
        const [rows] = await db.query(
            `SELECT p.id, p.user_id, p.content, p.image_url, p.status, p.created_at, p.updated_at,
                    u.first_name, u.last_name, u.username, u.profile_image,
                    (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS comment_count
             FROM community_posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.status = 'approved'
             ORDER BY p.created_at DESC`
        );

        if (!viewerId) return rows;

        const [ownRows] = await db.query(
            `SELECT p.id, p.user_id, p.content, p.image_url, p.status, p.created_at, p.updated_at,
                    u.first_name, u.last_name, u.username, u.profile_image,
                    (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = p.id) AS comment_count
             FROM community_posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.user_id = ? AND p.status IN ('pending', 'declined')
             ORDER BY p.created_at DESC`,
            [viewerId]
        );

        return [...ownRows, ...rows];
    }

    static async updatePostByOwner(postId, userId, payload) {
        const [result] = await db.query(
            `UPDATE community_posts
             SET content = ?,
                 image_url = ?,
                 image_public_id = ?,
                 status = 'pending',
                 moderation_note = NULL,
                 moderated_by = NULL,
                 moderated_at = NULL,
                 updated_at = NOW()
             WHERE id = ? AND user_id = ?`,
            [payload.content, payload.imageUrl || null, payload.imagePublicId || null, postId, userId]
        );
        return result.affectedRows > 0;
    }

    static async deletePostByOwner(postId, userId) {
        const [result] = await db.query(
            'DELETE FROM community_posts WHERE id = ? AND user_id = ?',
            [postId, userId]
        );
        return result.affectedRows > 0;
    }

    static async getPendingPosts() {
        const [rows] = await db.query(
            `SELECT p.id, p.user_id, p.content, p.image_url, p.status, p.created_at, p.updated_at,
                    u.first_name, u.last_name, u.username, u.profile_image
             FROM community_posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.status = 'pending'
             ORDER BY p.created_at ASC`
        );
        return rows;
    }

    static async moderatePost(postId, moderatorId, status, moderationNote = null) {
        const [result] = await db.query(
            `UPDATE community_posts
             SET status = ?, moderation_note = ?, moderated_by = ?, moderated_at = NOW(), updated_at = NOW()
             WHERE id = ?`,
            [status, moderationNote, moderatorId, postId]
        );
        return result.affectedRows > 0;
    }

    static async createComment({ postId, userId, commentText }) {
        const [result] = await db.query(
            `INSERT INTO community_comments (post_id, user_id, comment_text)
             VALUES (?, ?, ?)`,
            [postId, userId, commentText]
        );
        return result.insertId;
    }

    static async getCommentsByPost(postId, viewerId = null) {
        const [rows] = await db.query(
            `SELECT c.id, c.post_id, c.user_id, c.comment_text, c.is_reported, c.created_at, c.updated_at,
                    u.first_name, u.last_name, u.username, u.profile_image,
                    COUNT(ch.id) AS heart_count,
                    MAX(CASE WHEN ch.user_id = ? THEN 1 ELSE 0 END) AS hearted_by_viewer
             FROM community_comments c
             JOIN users u ON c.user_id = u.id
             LEFT JOIN community_comment_hearts ch ON ch.comment_id = c.id
             WHERE c.post_id = ?
             GROUP BY c.id
             ORDER BY c.created_at ASC`,
            [viewerId || 0, postId]
        );
        return rows;
    }

    static async getCommentById(commentId) {
        const [rows] = await db.query(
            `SELECT * FROM community_comments WHERE id = ?`,
            [commentId]
        );
        return rows[0] || null;
    }

    static async updateCommentByOwner(commentId, userId, commentText) {
        const [result] = await db.query(
            `UPDATE community_comments
             SET comment_text = ?, updated_at = NOW()
             WHERE id = ? AND user_id = ?`,
            [commentText, commentId, userId]
        );
        return result.affectedRows > 0;
    }

    static async deleteCommentByOwner(commentId, userId) {
        const [result] = await db.query(
            'DELETE FROM community_comments WHERE id = ? AND user_id = ?',
            [commentId, userId]
        );
        return result.affectedRows > 0;
    }

    static async toggleCommentHeart(commentId, userId) {
        const [existing] = await db.query(
            'SELECT id FROM community_comment_hearts WHERE comment_id = ? AND user_id = ?',
            [commentId, userId]
        );

        let hearted;
        if (existing.length > 0) {
            await db.query(
                'DELETE FROM community_comment_hearts WHERE comment_id = ? AND user_id = ?',
                [commentId, userId]
            );
            hearted = false;
        } else {
            await db.query(
                'INSERT INTO community_comment_hearts (comment_id, user_id) VALUES (?, ?)',
                [commentId, userId]
            );
            hearted = true;
        }

        const [countRows] = await db.query(
            'SELECT COUNT(*) AS count FROM community_comment_hearts WHERE comment_id = ?',
            [commentId]
        );

        return { hearted, heartCount: countRows[0]?.count || 0 };
    }

    static async reportComment({ commentId, userId, reason }) {
        await db.query(
            `INSERT INTO community_comment_reports (comment_id, user_id, reason, status)
             VALUES (?, ?, ?, 'pending')
             ON DUPLICATE KEY UPDATE reason = VALUES(reason), status = 'pending', updated_at = NOW()`,
            [commentId, userId, reason]
        );

        await db.query(
            'UPDATE community_comments SET is_reported = TRUE WHERE id = ?',
            [commentId]
        );
    }

    static async getReportedComments() {
        const [rows] = await db.query(
            `SELECT r.id AS report_id, r.comment_id, r.user_id AS reported_by, r.reason, r.status,
                    r.created_at AS reported_at,
                    c.comment_text, c.user_id AS comment_user_id, c.is_reported,
                    p.id AS post_id, p.content AS post_content,
                    cu.first_name AS comment_first_name, cu.last_name AS comment_last_name, cu.username AS comment_username, cu.profile_image AS comment_profile_image,
                    ru.first_name AS reporter_first_name, ru.last_name AS reporter_last_name, ru.username AS reporter_username
             FROM community_comment_reports r
             JOIN community_comments c ON c.id = r.comment_id
             JOIN community_posts p ON p.id = c.post_id
             JOIN users cu ON cu.id = c.user_id
             JOIN users ru ON ru.id = r.user_id
             WHERE r.status = 'pending'
             ORDER BY r.created_at ASC`
        );
        return rows;
    }

    static async reviewCommentReport(reportId, reviewerId, status) {
        const [reportRows] = await db.query(
            'SELECT comment_id FROM community_comment_reports WHERE id = ?',
            [reportId]
        );

        const report = reportRows[0];
        if (!report) return false;

        const [result] = await db.query(
            `UPDATE community_comment_reports
             SET status = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
             WHERE id = ?`,
            [status, reviewerId, reportId]
        );

        const [pendingRows] = await db.query(
            `SELECT COUNT(*) AS pending_count
             FROM community_comment_reports
             WHERE comment_id = ? AND status = 'pending'`,
            [report.comment_id]
        );

        if ((pendingRows[0]?.pending_count || 0) === 0) {
            await db.query(
                'UPDATE community_comments SET is_reported = FALSE WHERE id = ?',
                [report.comment_id]
            );
        }

        return result.affectedRows > 0;
    }

    static async getUserProfileById(userId) {
        const [rows] = await db.query(
            `SELECT id, first_name, last_name, username, role, profile_image, created_at
             FROM users WHERE id = ?`,
            [userId]
        );
        return rows[0] || null;
    }
}

module.exports = Community;
