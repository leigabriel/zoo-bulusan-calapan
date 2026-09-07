const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const AdminMasterKey = require('../models/admin-master-key-model');

const validKey = value => typeof value === 'string' && value.length >= 8 && value.length <= 128;
const challengeSecret = () => process.env.JWT_SECRET || 'your-secret-key';

const publicUser = user => ({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    email: user.email,
    phoneNumber: user.phone_number,
    gender: user.gender,
    birthday: user.birthday,
    role: user.role,
    profileImage: user.profile_image,
    hasPassword: Boolean(user.password),
    authProvider: user.auth_provider || (user.google_id ? 'google' : 'local')
});

const generateAdminToken = (userId, tabId) => jwt.sign(
    { id: userId, role: 'admin', ...(tabId ? { tabId } : {}), masterKeyVerified: true },
    challengeSecret(),
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
);

exports.verifyLoginMasterKey = async (req, res) => {
    try {
        const { challengeToken, masterKey } = req.body;
        if (!challengeToken || !validKey(masterKey)) {
            return res.status(401).json({ success: false, message: 'Master Key is required.' });
        }
        const challenge = jwt.verify(challengeToken, challengeSecret());
        if (challenge.purpose !== 'admin-master-key' || challenge.role !== 'admin' || !challenge.id) {
            return res.status(401).json({ success: false, message: 'Invalid Master Key challenge.' });
        }
        const user = await User.findById(challenge.id);
        if (!user || user.role !== 'admin' || !user.is_active || !(await AdminMasterKey.verify(user.id, masterKey))) {
            return res.status(401).json({ success: false, message: 'Incorrect Master Key.' });
        }
        res.json({ success: true, token: generateAdminToken(user.id, challenge.tabId), user: publicUser(user) });
    } catch (error) {
        console.error('Admin Master Key verification error:', error.message);
        res.status(401).json({ success: false, message: 'Master Key verification failed.' });
    }
};

const verifyPassword = async (adminId, password) => {
    const user = await User.findById(adminId);
    if (!user || user.role !== 'admin' || !user.password || !(await bcrypt.compare(password || '', user.password))) return null;
    return user;
};

exports.getStatus = async (req, res) => {
    res.json({ success: true, status: await AdminMasterKey.getStatus(req.user.id) });
};

exports.create = async (req, res) => {
    try {
        const { currentPassword, masterKey } = req.body;
        if (!validKey(masterKey)) return res.status(400).json({ success: false, message: 'Master Key must be 8 to 128 characters.' });
        if (!await verifyPassword(req.user.id, currentPassword)) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        const status = await AdminMasterKey.getStatus(req.user.id);
        if (status.configured) return res.status(409).json({ success: false, message: 'A Master Key already exists. Use Change instead.' });
        await AdminMasterKey.create(req.user.id, masterKey);
        res.json({ success: true, status: { configured: true, enabled: true } });
    } catch (error) {
        console.error('Error creating admin Master Key:', error);
        res.status(500).json({ success: false, message: 'Unable to create Master Key.' });
    }
};

exports.change = async (req, res) => {
    try {
        const { currentPassword, currentMasterKey, newMasterKey } = req.body;
        if (!validKey(newMasterKey) || !validKey(currentMasterKey)) return res.status(400).json({ success: false, message: 'Master Keys must be 8 to 128 characters.' });
        if (!await verifyPassword(req.user.id, currentPassword) || !(await AdminMasterKey.verify(req.user.id, currentMasterKey))) return res.status(401).json({ success: false, message: 'Authentication details are incorrect.' });
        await AdminMasterKey.change(req.user.id, newMasterKey);
        res.json({ success: true, status: { configured: true, enabled: true } });
    } catch (error) {
        console.error('Error changing admin Master Key:', error);
        res.status(500).json({ success: false, message: 'Unable to change Master Key.' });
    }
};

exports.toggle = async (req, res) => {
    try {
        const { currentPassword, masterKey, enabled } = req.body;
        const nextEnabled = enabled === true || enabled === 1 || enabled === '1' || enabled === 'true';
        if (!await verifyPassword(req.user.id, currentPassword)) return res.status(401).json({ success: false, message: 'Current account password is incorrect.' });
        await AdminMasterKey.setEnabled(req.user.id, nextEnabled);
        res.json({ success: true, status: { configured: true, enabled: nextEnabled } });
    } catch (error) {
        console.error('Error toggling admin Master Key:', error);
        res.status(500).json({ success: false, message: 'Unable to update Master Key settings.' });
    }
};
