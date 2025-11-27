const db = require('../config/database');

exports.getPredictions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const offset = (page - 1) * limit;

        const [countResult] = await db.query('SELECT COUNT(*) as total FROM predictions');
        const total = countResult[0].total;

        const [predictions] = await db.query(
            'SELECT id, user_id, animal_name, confidence, image_filename, created_at FROM predictions ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        const [statsResult] = await db.query(`
            SELECT animal_name, COUNT(*) as count 
            FROM predictions 
            GROUP BY animal_name
        `);
            
        const stats = {
            Bear: 0, Bird: 0, Cat: 0, Cow: 0, Deer: 0, Dog: 0, Dolphin: 0,
            Elephant: 0, Giraffe: 0, Horse: 0, Kangaroo: 0, Lion: 0,
            Panda: 0, Tiger: 0, Zebra: 0
        };

        statsResult.forEach(row => {
            if (Object.prototype.hasOwnProperty.call(stats, row.animal_name)) {
                stats[row.animal_name] = row.count;
            }
        });

        res.json({
            success: true,
            predictions: predictions.map(p => ({
                id: p.id,
                userId: p.user_id,
                prediction: p.animal_name,
                confidence: p.confidence,
                filename: p.image_filename,
                createdAt: p.created_at ? new Date(p.created_at).toISOString() : null
            })),
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            stats
        });
    } catch (error) {
        console.error('Error fetching predictions:', error);
        res.status(500).json({ success: false, message: 'Error fetching predictions' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const [statsResult] = await db.query(`
            SELECT animal_name, COUNT(*) as count 
            FROM predictions 
            GROUP BY animal_name
        `);
            
        const stats = {
            Bear: 0, Bird: 0, Cat: 0, Cow: 0, Deer: 0, Dog: 0, Dolphin: 0,
            Elephant: 0, Giraffe: 0, Horse: 0, Kangaroo: 0, Lion: 0,
            Panda: 0, Tiger: 0, Zebra: 0
        };

        statsResult.forEach(row => {
            if (Object.prototype.hasOwnProperty.call(stats, row.animal_name)) {
                stats[row.animal_name] = row.count;
            }
        });

        const [totalResult] = await db.query('SELECT COUNT(*) as total FROM predictions');

        res.json({
            success: true,
            stats,
            total: totalResult[0].total
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
};

exports.createPrediction = async (req, res) => {
    try {
        const { filename, prediction, confidence } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!prediction || confidence === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                required: { prediction: 'string', confidence: 'number' }
            });
        }

        const [result] = await db.query(
            'INSERT INTO predictions (image_filename, animal_name, confidence, user_id) VALUES (?, ?, ?, ?)',
            [filename || 'uploaded_image.jpg', prediction, confidence, userId]
        );

        res.status(201).json({
            success: true,
            message: 'Prediction saved successfully',
            data: {
                predictionId: result.insertId,
                filename: filename || 'uploaded_image.jpg',
                prediction,
                confidence
            }
        });
    } catch (error) {
        console.error('Error creating prediction:', error);

        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(500).json({
                success: false,
                message: 'Database table not found. Please run the database.sql script.',
                error: 'predictions table does not exist'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error saving prediction',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.deletePredictions = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'No IDs provided' });
        }

        const placeholders = ids.map(() => '?').join(',');
        await db.query(`DELETE FROM predictions WHERE id IN (${placeholders})`, ids);

        res.json({ success: true, message: 'Predictions deleted successfully' });
    } catch (error) {
        console.error('Error deleting predictions:', error);
        res.status(500).json({ success: false, message: 'Error deleting predictions' });
    }
};

exports.clearAllPredictions = async (req, res) => {
    try {
        await db.query('DELETE FROM predictions');
        res.json({ success: true, message: 'All predictions cleared' });
    } catch (error) {
        console.error('Error clearing predictions:', error);
        res.status(500).json({ success: false, message: 'Error clearing predictions' });
    }
};