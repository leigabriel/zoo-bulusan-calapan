const express = require('express');
const router = express.Router();
const { readConfig } = require('../config/legal-policy-config');

// Public: the privacy, terms, cookie and refund pages are reachable by
// visitors, including signed-out users on the login and sign-up screens.
// The response is small, read from memory, and changes only when an admin
// saves, so it is served without auth but never cached by the browser.
router.get('/policies', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, policies: readConfig() });
});

module.exports = router;
