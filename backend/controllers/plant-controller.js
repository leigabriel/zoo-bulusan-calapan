const Plant = require('../models/plant-model');

exports.getAllPlants = async (req, res) => {
    try {
        const plants = await Plant.getAll();
        res.json({ success: true, plants });
    } catch (error) {
        console.error('Error getting plants:', error);
        res.status(500).json({ success: false, message: 'Error fetching plants' });
    }
};

exports.getPlantById = async (req, res) => {
    try {
        const { id } = req.params;
        const plant = await Plant.findById(id);
        
        if (!plant) {
            return res.status(404).json({ success: false, message: 'Plant not found' });
        }
        
        res.json({ success: true, plant });
    } catch (error) {
        console.error('Error getting plant:', error);
        res.status(500).json({ success: false, message: 'Error fetching plant' });
    }
};

exports.createPlant = async (req, res) => {
    try {
        const plantId = await Plant.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Plant created successfully',
            plantId
        });
    } catch (error) {
        console.error('Error creating plant:', error);
        res.status(500).json({ success: false, message: 'Error creating plant' });
    }
};

exports.updatePlant = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Plant.update(id, req.body);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Plant not found' });
        }

        res.json({ success: true, message: 'Plant updated successfully' });
    } catch (error) {
        console.error('Error updating plant:', error);
        res.status(500).json({ success: false, message: 'Error updating plant' });
    }
};

exports.deletePlant = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Plant.delete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Plant not found' });
        }

        res.json({ success: true, message: 'Plant deleted successfully' });
    } catch (error) {
        console.error('Error deleting plant:', error);
        res.status(500).json({ success: false, message: 'Error deleting plant' });
    }
};

exports.updatePlantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['healthy', 'growing', 'dormant', 'sick', 'treatment'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const updated = await Plant.updateStatus(id, status);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Plant not found' });
        }

        res.json({ success: true, message: 'Plant status updated successfully' });
    } catch (error) {
        console.error('Error updating plant status:', error);
        res.status(500).json({ success: false, message: 'Error updating plant status' });
    }
};

exports.getPlantsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const plants = await Plant.findByCategory(category);
        res.json({ success: true, plants });
    } catch (error) {
        console.error('Error getting plants by category:', error);
        res.status(500).json({ success: false, message: 'Error fetching plants' });
    }
};

exports.getPlantStats = async (req, res) => {
    try {
        const [total, healthy, sick] = await Promise.all([
            Plant.count(),
            Plant.countByStatus('healthy'),
            Plant.countByStatus('sick')
        ]);

        res.json({
            success: true,
            stats: {
                total,
                healthy,
                sick,
                other: total - healthy - sick
            }
        });
    } catch (error) {
        console.error('Error getting plant stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching plant stats' });
    }
};
