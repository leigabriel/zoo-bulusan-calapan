const Message = require('../models/message-model');
const { sendContactEmail } = require('../utils/email');

const LIMITS = {
    name: 120,
    email: 254,
    subject: 200,
    concern: 4000
};

const clean = (value, maxLength) => String(value ?? '')
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, maxLength);

// Single-line fields must not carry newlines into mail headers.
const cleanLine = (value, maxLength) => clean(value, maxLength).replace(/\s+/g, ' ');

/**
 * Public login-page contact form. No account is required: the message is
 * forwarded to the shared support mailbox and the visitor's address is set as
 * the reply-to address.
 */
exports.submitContact = async (req, res) => {
    try {
        const name = cleanLine(req.body?.name, LIMITS.name);
        const email = cleanLine(req.body?.email, LIMITS.email).toLowerCase();
        const subject = cleanLine(req.body?.subject, LIMITS.subject);
        const concern = clean(req.body?.concern, LIMITS.concern);

        if (!name || !email || !subject || !concern) {
            return res.status(400).json({
                success: false,
                message: 'Please complete your name, email, subject, and concern.'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // Save the message first so it appears in the admin/staff Messages page
        // even when the notification email cannot be delivered.
        let messageId = null;
        try {
            messageId = await Message.createGuestMessage({
                name,
                email,
                subject,
                content: concern
            });
        } catch (error) {
            console.error('Could not save contact message:', error);
        }

        const delivered = await sendContactEmail({ name, email, subject, concern });
        if (!messageId && !delivered) {
            return res.status(503).json({
                success: false,
                message: 'We could not send your message right now. Please try again or email bulusanzoo@gmail.com directly.'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Your message has been sent. Our team will get back to you soon.',
            messageId
        });
    } catch (error) {
        console.error('Contact submission error:', error);
        return res.status(500).json({
            success: false,
            message: 'We could not send your message right now. Please try again or email bulusanzoo@gmail.com directly.'
        });
    }
};

module.exports.LIMITS = LIMITS;
module.exports.clean = clean;
module.exports.cleanLine = cleanLine;
