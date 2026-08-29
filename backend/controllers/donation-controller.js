const { readConfig, writeConfig } = require('../config/donation-config');

exports.getPublicConfig = (req, res) => {
    try {
        const config = readConfig();
        res.json({
            success: true,
            config: {
                enabled: config.enabled,
                gcashNumber: config.gcashNumber,
                accountName: config.accountName,
                note: config.note
            }
        });
    } catch (error) {
        console.error('Error getting donation config:', error);
        res.status(500).json({ success: false, message: 'Error getting donation config' });
    }
};

exports.getConfig = (req, res) => {
    try {
        const config = readConfig();
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error getting donation config:', error);
        res.status(500).json({ success: false, message: 'Error getting donation config' });
    }
};

exports.updateConfig = (req, res) => {
    try {
        const { config } = req.body;

        if (!config) {
            return res.status(400).json({ success: false, message: 'Donation config is required' });
        }

        const updated = writeConfig({
            enabled: config.enabled,
            gcashNumber: config.gcashNumber,
            accountName: config.accountName,
            note: config.note
        });

        res.json({ success: true, message: 'Donation settings updated successfully', config: updated });
    } catch (error) {
        console.error('Error updating donation config:', error);
        res.status(500).json({ success: false, message: 'Error updating donation config' });
    }
};
