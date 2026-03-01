const Collection = require('../models/collection-model');

// Get user's collection
exports.getMyCollection = async (req, res) => {
    try {
        const collection = await Collection.getByUserId(req.user.id);
        res.json({ success: true, collection });
    } catch (error) {
        console.error('Error getting collection:', error);
        res.status(500).json({ success: false, message: 'Error fetching collection' });
    }
};

// Add animal to collection
exports.addToCollection = async (req, res) => {
    try {
        const { animalName, description, category, confidence, capturedImage } = req.body;

        if (!animalName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Animal name is required' 
            });
        }

        const result = await Collection.add({
            userId: req.user.id,
            animalName: animalName.trim(),
            description: description?.trim(),
            category: category?.trim(),
            confidence: parseFloat(confidence) || 0,
            capturedImage
        });

        if (!result.success) {
            return res.status(400).json({ 
                success: false, 
                message: result.message || 'Animal already in collection' 
            });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Animal added to collection',
            collectionId: result.id 
        });
    } catch (error) {
        console.error('Error adding to collection:', error);
        res.status(500).json({ success: false, message: 'Error adding to collection' });
    }
};

// Remove animal from collection
exports.removeFromCollection = async (req, res) => {
    try {
        const { id } = req.params;
        const removed = await Collection.remove(id, req.user.id);

        if (!removed) {
            return res.status(404).json({ 
                success: false, 
                message: 'Collection item not found' 
            });
        }

        res.json({ success: true, message: 'Animal removed from collection' });
    } catch (error) {
        console.error('Error removing from collection:', error);
        res.status(500).json({ success: false, message: 'Error removing from collection' });
    }
};

// Get collection stats
exports.getCollectionStats = async (req, res) => {
    try {
        const stats = await Collection.getStats(req.user.id);
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error getting collection stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching stats' });
    }
};
