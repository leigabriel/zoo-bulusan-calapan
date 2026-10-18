const nodemailer = require('nodemailer');

/**
 * Transactional email is handed to Brevo's HTTP API, not relayed from this
 * server. Gmail's SMTP endpoint rejects or throttles connections from datacenter
 * IPs such as Render's, so sending was unreliable in production; Brevo accepts
 * the message over plain HTTPS and delivers it from its own infrastructure.
 *
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 *   POST https://api.brevo.com/v3/smtp/email
 *   header: api-key: <BREVO_API_KEY>
 *   body:   { sender: { name, email }, to: [{ email, name }], subject, htmlContent, textContent }
 *   201 -> { messageId }
 *
 * SMTP is kept only as a fallback for a deployment with no Brevo key configured,
 * so nothing breaks while the new credentials are being added.
 */
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_TIMEOUT_MS = 10000;
const DEFAULT_SENDER_NAME = 'Bulusan Zoo';

const brevoSettings = () => ({
    apiKey: (process.env.BREVO_API_KEY || '').trim(),
    senderEmail: (process.env.BREVO_SENDER_EMAIL || '').trim(),
    senderName: (process.env.BREVO_SENDER_NAME || '').trim() || DEFAULT_SENDER_NAME
});

// Both halves are needed: a key without a verified sender is rejected by Brevo.
const isBrevoConfigured = () => {
    const { apiKey, senderEmail } = brevoSettings();
    return Boolean(apiKey && senderEmail);
};

/**
 * "Name" <address> for the nodemailer-shaped mailOptions every template builds,
 * so the sender comes from Brevo once it is configured.
 */
const senderAddress = () => {
    const { senderEmail, senderName } = brevoSettings();
    const address = isBrevoConfigured() ? senderEmail : process.env.SMTP_USER;
    return `"${senderName}" <${address}>`;
};

/**
 * True when a failure is worth retrying. A rejected key, a bad payload or an
 * unverified sender will fail identically on every attempt; a timeout, a 429 or
 * a 5xx may succeed later.
 */
const isPermanentFailure = (status) => status === 400 || status === 401 || status === 403 || status === 404;

/**
 * Send one message through Brevo. Resolves to { messageId } on success and
 * throws an Error carrying `status` / `retryable` otherwise.
 */
const sendViaBrevo = async (mailOptions) => {
    const { apiKey, senderName, senderEmail } = brevoSettings();

    if (!apiKey || !senderEmail) {
        throw new Error('Missing Brevo configuration. Please check environment variables.');
    }

    const payload = {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: mailOptions.to }],
        subject: mailOptions.subject,
        htmlContent: mailOptions.html
    };
    // A plain-text alternative avoids multipart/related weirdness in clients
    // that render only the text part.
    if (mailOptions.text) payload.textContent = mailOptions.text;

    const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            accept: 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(BREVO_TIMEOUT_MS)
    });

    if (!response.ok) {
        // Brevo answers { code, message }; never echo the raw body into logs
        // beyond the message, which can include the recipient address.
        let detail = '';
        try {
            const body = await response.json();
            detail = body?.message || body?.code || '';
        } catch {
            detail = await response.text().catch(() => '');
        }
        const error = new Error(`Brevo rejected the message (HTTP ${response.status})${detail ? `: ${detail}` : ''}`);
        error.status = response.status;
        error.retryable = !isPermanentFailure(response.status);
        throw error;
    }

    let messageId = null;
    try {
        messageId = (await response.json())?.messageId || null;
    } catch {
        // A 201 with an unreadable body is still a successful send.
    }
    return { messageId };
};

// cached transporter
let cachedTransporter = null;

// get or create smtp transporter
const getTransporter = () => {
    if (cachedTransporter) {
        return cachedTransporter;
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        throw new Error('Missing SMTP configuration. Please check environment variables.');
    }

    const port = parseInt(SMTP_PORT, 10);
    
    cachedTransporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: port,
        secure: port === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        },
        // Connection pooling for better performance
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        // Timeout configuration to prevent hanging
        connectionTimeout: 10000, // 10 seconds to establish connection
        greetingTimeout: 10000,   // 10 seconds for server greeting
        socketTimeout: 30000,     // 30 seconds for socket inactivity
        tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
    });

    // Verify transporter configuration on first use
    cachedTransporter.verify()
        .then(() => console.log('[Email] SMTP transporter verified successfully'))
        .catch(err => console.error('[Email] SMTP verification failed:', err.message));

    return cachedTransporter;
};

/**
 * Log email events with structured format
 * @param {string} level - Log level (info, warn, error)
 * @param {string} message - Log message
 * @param {object} meta - Additional metadata
 */
const logEmail = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...meta };
    
    if (level === 'error') {
        console.error('[Email]', JSON.stringify(logEntry));
    } else if (level === 'warn') {
        console.warn('[Email]', JSON.stringify(logEntry));
    } else {
        console.log('[Email]', JSON.stringify(logEntry));
    }
};

/**
 * Send email with retry logic
 * @param {object} mailOptions - Nodemailer mail options
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} retryDelay - Delay between retries in ms
 * @returns {Promise<boolean>}
 */
// One warning per process: a deployment missing its Brevo variables silently
// keeps relaying through SMTP, which looks like the Brevo change never landed.
let hasWarnedAboutSmtpFallback = false;

const sendEmailWithRetry = async (mailOptions, maxRetries = 3, retryDelay = 2000) => {
    const useBrevo = isBrevoConfigured();
    let transporter = null;
    if (!useBrevo) {
        if (!hasWarnedAboutSmtpFallback) {
            hasWarnedAboutSmtpFallback = true;
            logEmail('warn', 'Brevo is not configured - relaying through SMTP instead', {
                missing: ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL'].filter(key => !process.env[key])
            });
        }
        // No Brevo key: fall back to SMTP. When neither transport is configured
        // this used to throw, which turned a missing-email-credentials problem
        // into a failed request for every caller that returns this value
        // directly. Every caller here works in booleans ("was it delivered?"),
        // so report that honestly instead.
        try {
            transporter = getTransporter();
        } catch (error) {
            logEmail('error', 'No email transport configured', {
                to: mailOptions.to,
                subject: mailOptions.subject,
                error: error.message
            });
            return false;
        }
    }
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const info = useBrevo ? await sendViaBrevo(mailOptions) : await transporter.sendMail(mailOptions);
            logEmail('info', 'Email sent successfully', {
                to: mailOptions.to,
                subject: mailOptions.subject,
                provider: useBrevo ? 'brevo' : 'smtp',
                messageId: info.messageId,
                attempt
            });
            return true;
        } catch (error) {
            lastError = error;
            logEmail('warn', `Email send attempt ${attempt} failed`, {
                to: mailOptions.to,
                subject: mailOptions.subject,
                error: error.message,
                code: error.code,
                status: error.status,
                attempt,
                maxRetries
            });

            // Don't retry on authentication or configuration errors
            if (error.code === 'EAUTH' || error.responseCode === 535 || error.retryable === false) {
                logEmail('error', 'Email rejected permanently - not retrying', {
                    to: mailOptions.to,
                    error: error.message
                });
                break;
            }

            // Wait before retrying (except on last attempt)
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }
    }

    logEmail('error', 'Email send failed after all retries', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        error: lastError?.message,
        code: lastError?.code
    });

    return false;
};

/**
 * Send email asynchronously (fire and forget with retry)
 * @param {object} mailOptions - Nodemailer mail options
 */
const sendEmailAsync = (mailOptions) => {
    // Fire and forget - don't block the calling function
    setImmediate(async () => {
        try {
            await sendEmailWithRetry(mailOptions);
        } catch (error) {
            logEmail('error', 'Async email send failed', {
                to: mailOptions.to,
                error: error.message
            });
        }
    });
};

/**
 * Send verification email to user (non-blocking)
 * Uses fire-and-forget pattern with retry logic to prevent API response delays
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - Returns true immediately (email sent in background)
 */
const sendVerificationEmail = async (email, token, firstName) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const verificationLink = `${backendUrl}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
        from: senderAddress(),
        to: email,
        subject: 'Verify Your Email - Bulusan Zoo',
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6;">
                <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f7f6; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Bulusan Zoo</h1>
                                        <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Wildlife Sanctuary</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Welcome, ${firstName}!</h2>
                                        <p style="margin: 0 0 25px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                            Thank you for registering with Bulusan Zoo. To complete your registration and gain access to your account, please verify your email address by clicking the button below.
                                        </p>
                                        
                                        <!-- CTA Button -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 10px 0 30px;">
                                                    <a href="${verificationLink}" 
                                                       style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                                                        Verify Email Address
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                            This verification link will expire in <strong>1 hour</strong>. If you did not create an account with Bulusan Zoo, please ignore this email.
                                        </p>
                                        
                                        <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                            If the button above doesn't work, copy and paste this link into your browser:
                                        </p>
                                        <p style="margin: 0; padding: 15px; background-color: #f3f4f6; border-radius: 6px; word-break: break-all; color: #059669; font-size: 13px;">
                                            ${verificationLink}
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                                        <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">
                                            &copy; ${new Date().getFullYear()} Bulusan Zoo. All rights reserved.
                                        </p>
                                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                            Sorsogon, Philippines
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `,
        text: `
Welcome to Bulusan Zoo, ${firstName}!

Thank you for registering. Please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 1 hour.

If you did not create an account with Bulusan Zoo, please ignore this email.

© ${new Date().getFullYear()} Bulusan Zoo. All rights reserved.
        `.trim()
    };

    // Use fire-and-forget pattern with retry logic
    // This returns immediately while email sends in background
    logEmail('info', 'Queueing verification email', { to: email, firstName });
    sendEmailAsync(mailOptions);
    return true;
};

/**
 * Send verification email synchronously with retry (for cases requiring confirmation)
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - Actual success status after sending
 */
const sendVerificationEmailSync = async (email, token, firstName) => {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const verificationLink = `${backendUrl}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
        from: senderAddress(),
        to: email,
        subject: 'Verify Your Email - Bulusan Zoo',
        html: generateVerificationEmailHtml(firstName, verificationLink),
        text: generateVerificationEmailText(firstName, verificationLink)
    };

    return await sendEmailWithRetry(mailOptions);
};

/**
 * Generate HTML content for verification email
 */
const generateVerificationEmailHtml = (firstName, verificationLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f7f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Bulusan Zoo</h1>
                            <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Wildlife Sanctuary</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Welcome, ${firstName}!</h2>
                            <p style="margin: 0 0 25px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Thank you for registering with Bulusan Zoo. To complete your registration and gain access to your account, please verify your email address by clicking the button below.
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 10px 0 30px;">
                                        <a href="${verificationLink}" 
                                           style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                This verification link will expire in <strong>1 hour</strong>. If you did not create an account with Bulusan Zoo, please ignore this email.
                            </p>
                            <p style="margin: 0 0 15px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                If the button above doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0; padding: 15px; background-color: #f3f4f6; border-radius: 6px; word-break: break-all; color: #059669; font-size: 13px;">
                                ${verificationLink}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">
                                &copy; ${new Date().getFullYear()} Bulusan Zoo. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Sorsogon, Philippines
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * Generate plain text content for verification email
 */
const generateVerificationEmailText = (firstName, verificationLink) => `
Welcome to Bulusan Zoo, ${firstName}!

Thank you for registering. Please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 1 hour.

If you did not create an account with Bulusan Zoo, please ignore this email.

© ${new Date().getFullYear()} Bulusan Zoo. All rights reserved.
`.trim();

const sendPasswordResetEmail = async (email, token, firstName) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/login?resetToken=${encodeURIComponent(token)}`;
    const mailOptions = {
        from: senderAddress(),
        to: email,
        subject: 'Reset Your Password - Bulusan Zoo',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1f3328">
                <h1>Bulusan Zoo</h1>
                <h2>Reset your password</h2>
                <p>Hello ${firstName || 'there'},</p>
                <p>We received a request to create a new password for your account. This link expires in 1 hour.</p>
                <p><a href="${resetLink}" style="display:inline-block;padding:13px 22px;background:#1f3328;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Create a new password</a></p>
                <p style="color:#66756b;font-size:13px">If you did not request this, you can safely ignore this email.</p>
            </div>
        `,
        text: `Hello ${firstName || 'there'},\n\nCreate a new Bulusan Zoo password here: ${resetLink}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`
    };

    return sendEmailWithRetry(mailOptions);
};

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildWelcomeEmailText = ({ firstName, username, profileUrl, hasPassword }) => {
    const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
    const passwordNote = hasPassword
        ? null
        : 'You signed in with Google and do not have a password yet. If you would like to set a password for your account, you can add one any time from your profile so you can also sign in with your email address.';

    const paragraphs = [
        'Welcome to Bulusan Zoo!',
        greeting,
        `Your account is active and ready to use. We will call you @${username}.`,
        passwordNote,
        'You can now browse animals, book tickets and reserve events.',
        `Manage your account: ${profileUrl}`,
        `© ${new Date().getFullYear()} Bulusan Zoo. All rights reserved.`
    ].filter(Boolean);

    return paragraphs.join('\n\n').trim();
};

const buildWelcomeEmailHtml = ({ firstName, username, profileUrl, hasPassword }) => {
    const safeName = escapeHtml(firstName || 'there');
    const safeUsername = escapeHtml(username);
    const safeProfileUrl = escapeHtml(profileUrl);
    const passwordNote = hasPassword
        ? ''
        : `
                            <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                                You signed in with Google and do not have a password yet. If you would like to set a password for your account, you can add one any time from your profile so you can also sign in with your email address.
                            </p>`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Bulusan Zoo</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f7f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Bulusan Zoo</h1>
                            <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Wildlife Sanctuary</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Welcome, ${safeName}!</h2>
                            <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                                Your account is active and ready to use. We will call you <strong>@${safeUsername}</strong>.
                            </p>
                            ${passwordNote}
                            <p style="margin: 0 0 25px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                                You can now browse animals, book tickets and reserve events.
                            </p>
                            <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 5px 0 25px;">
                                        <a href="${safeProfileUrl}"
                                           style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                                            Manage Your Account
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">
                                &copy; ${new Date().getFullYear()} Bulusan Zoo. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Sorsogon, Philippines
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};

const sendNotificationEmail = async (email, firstName, title, message, link = null) => {
    if (!email) return false;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const destination = link ? new URL(link, frontendUrl).toString() : frontendUrl;
    const safeTitle = escapeHtml(title);
    const safeMessage = escapeHtml(message);
    const safeName = escapeHtml(firstName || 'there');

    const mailOptions = {
        from: senderAddress(),
        to: email,
        subject: `${title} - Bulusan Zoo`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1f3328">
                <h1 style="margin-bottom:24px">Bulusan Zoo</h1>
                <p>Hello ${safeName},</p>
                <h2>${safeTitle}</h2>
                <p style="line-height:1.6">${safeMessage}</p>
                <p><a href="${escapeHtml(destination)}" style="display:inline-block;padding:13px 22px;background:#1f3328;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">View update</a></p>
                <p style="color:#66756b;font-size:13px">You can manage notification delivery in your account settings.</p>
            </div>
        `,
        text: `Hello ${firstName || 'there'},\n\n${title}\n${message}\n\nView update: ${destination}\n\nManage notification delivery in your Bulusan Zoo account settings.`
    };

    // Awaited rather than fire-and-forget: callers record the real delivery result so a
    // failed send is visible instead of being reported as delivered.
    try {
        return await sendEmailWithRetry(mailOptions);
    } catch (error) {
        logEmail('error', 'Notification email failed', { to: email, error: error.message });
        return false;
    }
};

/**
 * Send the one-time welcome email sent on a visitor's first login.
 * Awaited by the caller, which only marks the welcome as sent when this returns true.
 */
const sendWelcomeEmail = async ({ email, firstName, username, profileUrl, hasPassword }) => {
    if (!email) return false;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const destination = profileUrl || `${frontendUrl}/profile`;
    const account = { firstName, username, profileUrl: destination, hasPassword };

    const mailOptions = {
        from: senderAddress(),
        to: email,
        subject: 'Welcome to Bulusan Zoo',
        html: buildWelcomeEmailHtml(account),
        text: buildWelcomeEmailText(account)
    };

    try {
        return await sendEmailWithRetry(mailOptions);
    } catch (error) {
        logEmail('error', 'Welcome email failed', { to: email, error: error.message });
        return false;
    }
};

module.exports = {
    sendVerificationEmail,
    sendVerificationEmailSync,
    sendPasswordResetEmail,
    sendEmailWithRetry,
    sendEmailAsync,
    sendNotificationEmail,
    sendWelcomeEmail,
    buildWelcomeEmailHtml,
    buildWelcomeEmailText
};
