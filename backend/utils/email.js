const nodemailer = require('nodemailer');

// Create SMTP transporter using environment variables
const createTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
        throw new Error('Missing SMTP configuration. Please check environment variables.');
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT, 10),
        secure: parseInt(SMTP_PORT, 10) === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        },
        tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
    });
};

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 * @param {string} firstName - User's first name
 * @returns {Promise<boolean>} - Success status
 */
const sendVerificationEmail = async (email, token, firstName) => {
    const transporter = createTransporter();
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

    await transporter.sendMail(mailOptions);
    return true;
};

module.exports = {
    sendVerificationEmail
};
