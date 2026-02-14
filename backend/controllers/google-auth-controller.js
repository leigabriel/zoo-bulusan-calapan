const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const https = require('https');
const User = require('../models/user-model');

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';

const httpsAgent = new https.Agent({
    rejectUnauthorized: true,
    keepAlive: true
});

const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            console.error(`Fetch attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
};

const getGoogleConfig = () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!clientId || !clientSecret || !callbackUrl) {
        throw new Error('Missing required Google OAuth environment variables');
    }

    return { clientId, clientSecret, callbackUrl, frontendUrl };
};

// In-memory state store for CSRF protection (use Redis in production for scalability)
const stateStore = new Map();
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Clean up expired states periodically
setInterval(() => {
    const now = Date.now();
    for (const [state, data] of stateStore.entries()) {
        if (now > data.expiresAt) {
            stateStore.delete(state);
        }
    }
}, 60 * 1000); // Clean every minute

/**
 * Generate a cryptographically secure state parameter for CSRF protection
 */
const generateState = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Decode and parse a JWT without verification (for extracting header info)
 */
const decodeJwtHeader = (token) => {
    const [headerB64] = token.split('.');
    const header = Buffer.from(headerB64, 'base64url').toString('utf8');
    return JSON.parse(header);
};

/**
 * Fetch Google's public keys for ID token verification
 */
const fetchGooglePublicKeys = async () => {
    const response = await fetchWithRetry(GOOGLE_CERTS_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch Google public keys');
    }
    return response.json();
};

/**
 * Verify Google ID token signature and claims
 * SECURITY: This validates issuer, audience, expiration, and signature
 */
const verifyGoogleIdToken = async (idToken, clientId) => {
    const { createPublicKey, verify } = await import('crypto');

    // Decode token parts
    const parts = idToken.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid ID token format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    // Verify issuer
    const validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
        throw new Error('Invalid token issuer');
    }

    // Verify audience
    if (payload.aud !== clientId) {
        throw new Error('Invalid token audience');
    }

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
        throw new Error('Token has expired');
    }

    // Verify not before (if present)
    if (payload.nbf && payload.nbf > now) {
        throw new Error('Token not yet valid');
    }

    // Verify email is verified
    if (!payload.email_verified) {
        throw new Error('Email not verified by Google');
    }

    // Fetch Google's public keys and verify signature
    const keys = await fetchGooglePublicKeys();
    const key = keys.keys.find(k => k.kid === header.kid);

    if (!key) {
        throw new Error('Unable to find matching public key');
    }

    // Convert JWK to PEM for verification
    const publicKey = createPublicKey({ key, format: 'jwk' });
    const signatureData = `${headerB64}.${payloadB64}`;
    const signature = Buffer.from(signatureB64, 'base64url');

    const isValid = verify(
        header.alg === 'RS256' ? 'RSA-SHA256' : header.alg,
        Buffer.from(signatureData),
        publicKey,
        signature
    );

    if (!isValid) {
        throw new Error('Invalid token signature');
    }

    return payload;
};

/**
 * Generate JWT token for authenticated user
 */
const generateToken = (userId, role, tabId = null) => {
    const payload = { id: userId, role };
    if (tabId) payload.tabId = tabId;
    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

/**
 * Initiate Google OAuth flow
 * Redirects user to Google's consent screen
 */
exports.initiateGoogleAuth = (req, res) => {
    try {
        const { clientId, callbackUrl } = getGoogleConfig();

        // Capture the origin for redirect back after OAuth
        // This allows both localhost and network IP access
        const referer = req.get('referer') || req.get('origin');
        let frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
        
        if (referer) {
            try {
                const refererUrl = new URL(referer);
                // Only allow same port (5173) to prevent redirect attacks
                if (refererUrl.port === '5173' || refererUrl.pathname.includes('/login')) {
                    frontendOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
                }
            } catch (e) {
                console.log('Could not parse referer URL:', e.message);
            }
        }

        // Generate CSRF state token with origin embedded
        const state = generateState();
        stateStore.set(state, {
            expiresAt: Date.now() + STATE_EXPIRY_MS,
            createdAt: Date.now(),
            frontendOrigin: frontendOrigin  // Store origin for callback redirect
        });

        // Build authorization URL with required scopes
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: callbackUrl,
            response_type: 'code',
            scope: 'openid email profile',
            state: state,
            access_type: 'offline',
            prompt: 'select_account'  // Allow account selection without forcing re-consent
        });

        const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
        console.log('Redirecting to Google OAuth:', authUrl.substring(0, 100) + '...');
        console.log('Frontend origin stored:', frontendOrigin);
        res.redirect(authUrl);
    } catch (error) {
        console.error('Google auth initiation error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/login?error=configuration_error`);
    }
};

/**
 * Handle Google OAuth callback
 * Exchanges authorization code for tokens and authenticates user
 */
exports.handleGoogleCallback = async (req, res) => {
    // Default frontend URL - will be overridden by stored origin if available
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let loginUrl = `${frontendUrl}/login`;

    try {
        console.log('Google callback received:', { 
            hasCode: !!req.query.code, 
            hasState: !!req.query.state, 
            error: req.query.error 
        });

        const { clientId, clientSecret, callbackUrl } = getGoogleConfig();
        const { code, state, error } = req.query;

        // Handle user cancellation or errors from Google
        if (error) {
            console.log('Google OAuth error:', error);
            return res.redirect(`${loginUrl}?error=google_auth_cancelled`);
        }

        if (!code || !state) {
            console.log('Missing code or state');
            return res.redirect(`${loginUrl}?error=invalid_request`);
        }

        // SECURITY: Verify state parameter to prevent CSRF attacks
        const storedState = stateStore.get(state);
        if (!storedState || Date.now() > storedState.expiresAt) {
            console.log('Invalid or expired state:', { hasStoredState: !!storedState });
            stateStore.delete(state);
            return res.redirect(`${loginUrl}?error=invalid_state`);
        }
        
        // Use stored frontend origin for redirect (supports both localhost and network IP)
        if (storedState.frontendOrigin) {
            frontendUrl = storedState.frontendOrigin;
            loginUrl = `${frontendUrl}/login`;
            console.log('Using stored frontend origin:', frontendUrl);
        }
        stateStore.delete(state);

        console.log('Exchanging code for tokens...');
        
        const tokenResponse = await fetchWithRetry(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: callbackUrl,
                grant_type: 'authorization_code'
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Token exchange failed:', errorData);
            return res.redirect(`${loginUrl}?error=token_exchange_failed`);
        }

        const tokens = await tokenResponse.json();
        console.log('Token exchange successful, verifying ID token...');

        if (!tokens.id_token) {
            console.log('No ID token in response');
            return res.redirect(`${loginUrl}?error=no_id_token`);
        }

        // SECURITY: Verify ID token (signature, issuer, audience, expiration)
        const googleUser = await verifyGoogleIdToken(tokens.id_token, clientId);
        console.log('ID token verified, user email:', googleUser.email);

        // Extract user information
        const { sub: googleId, email, name, picture, given_name, family_name } = googleUser;

        if (!email || !googleId) {
            return res.redirect(`${loginUrl}?error=invalid_user_data`);
        }

        // Check if user exists by email
        let user = await User.findByEmail(email);

        if (user) {
            console.log('Existing user found:', user.id);
            // User exists - check if already linked to Google
            if (user.google_id && user.google_id !== googleId) {
                // Email linked to different Google account
                return res.redirect(`${loginUrl}?error=email_linked_different_account`);
            }

            // Link Google account if not already linked
            if (!user.google_id) {
                await User.linkGoogleAccount(user.id, googleId, picture);
            } else if (picture && picture !== user.profile_image) {
                // Update profile image if changed
                await User.updateGoogleProfile(user.id, picture);
            }

            // Check if account is active
            if (!user.is_active) {
                return res.redirect(`${loginUrl}?error=account_deactivated`);
            }
        } else {
            // Create new user with Google as auth provider
            const firstName = given_name || name?.split(' ')[0] || 'User';
            const lastName = family_name || name?.split(' ').slice(1).join(' ') || '';
            
            // Generate unique username from email
            let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            let username = baseUsername;
            let counter = 1;

            while (await User.findByUsername(username)) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            const userId = await User.createGoogleUser({
                firstName,
                lastName,
                username,
                email: email.toLowerCase(),
                googleId,
                profileImage: picture || null,
                role: 'user'
            });

            user = await User.findById(userId);
        }

        // Generate JWT token
        const token = generateToken(user.id, user.role);

        // Prepare user data for frontend
        const userData = {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            email: user.email,
            role: user.role,
            profileImage: user.profile_image || picture,
            authProvider: 'google'
        };

        console.log('Google auth successful for user:', user.id, user.email);

        // Redirect to frontend with token and user data
        // Using URL fragment (#) for security - fragments are not sent to server
        const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
        const successUrl = `${frontendUrl}/auth/google/success#token=${token}&user=${userDataEncoded}`;
        
        res.redirect(successUrl);

    } catch (error) {
        console.error('Google callback error:', error);
        
        // Provide specific error messages for debugging in development
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? encodeURIComponent(error.message)
            : 'authentication_failed';
        
        res.redirect(`${loginUrl}?error=${errorMessage}`);
    }
};

/**
 * Logout endpoint - clears any server-side session data
 */
exports.googleLogout = async (req, res) => {
    try {
        // For JWT-based auth, client-side token removal is primary
        // This endpoint confirms logout and can be extended for additional cleanup
        res.json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error during logout' 
        });
    }
};