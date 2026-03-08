const nodemailer = require('nodemailer');

// Singleton transporter with connection pooling for better performance
let cachedTransporter = null;

/**
 * Get or create a cached SMTP transporter with connection pooling
 * @returns {nodemailer.Transporter}
 */
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
const sendEmailWithRetry = async (mailOptions, maxRetries = 3, retryDelay = 2000) => {
    const transporter = getTransporter();
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const info = await transporter.sendMail(mailOptions);
            logEmail('info', 'Email sent successfully', {
                to: mailOptions.to,
                subject: mailOptions.subject,
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
                attempt,
                maxRetries
            });

            // Don't retry on authentication or configuration errors
            if (error.code === 'EAUTH' || error.responseCode === 535) {
                logEmail('error', 'Email authentication failed - not retrying', {
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
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const verificationLink = `${backendUrl}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
        from: `"Zoo Bulusan" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify Your Email - Zoo Bulusan',
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
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Zoo Bulusan</h1>
                                        <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Wildlife Sanctuary</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Welcome, ${firstName}!</h2>
                                        <p style="margin: 0 0 25px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                            Thank you for registering with Zoo Bulusan. To complete your registration and gain access to your account, please verify your email address by clicking the button below.
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
                                            This verification link will expire in <strong>1 hour</strong>. If you did not create an account with Zoo Bulusan, please ignore this email.
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
                                            &copy; ${new Date().getFullYear()} Zoo Bulusan. All rights reserved.
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
Welcome to Zoo Bulusan, ${firstName}!

Thank you for registering. Please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 1 hour.

If you did not create an account with Zoo Bulusan, please ignore this email.

© ${new Date().getFullYear()} Zoo Bulusan. All rights reserved.
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
        from: `"Zoo Bulusan" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Verify Your Email - Zoo Bulusan',
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
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Zoo Bulusan</h1>
                            <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Wildlife Sanctuary</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">Welcome, ${firstName}!</h2>
                            <p style="margin: 0 0 25px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Thank you for registering with Zoo Bulusan. To complete your registration and gain access to your account, please verify your email address by clicking the button below.
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
                                This verification link will expire in <strong>1 hour</strong>. If you did not create an account with Zoo Bulusan, please ignore this email.
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
                                &copy; ${new Date().getFullYear()} Zoo Bulusan. All rights reserved.
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
Welcome to Zoo Bulusan, ${firstName}!

Thank you for registering. Please verify your email address by clicking the link below:

${verificationLink}

This link will expire in 1 hour.

If you did not create an account with Zoo Bulusan, please ignore this email.

© ${new Date().getFullYear()} Zoo Bulusan. All rights reserved.
`.trim();

module.exports = {
    sendVerificationEmail,
    sendVerificationEmailSync,
    sendEmailWithRetry,
    sendEmailAsync
};
