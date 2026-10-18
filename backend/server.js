const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const http = require('http');

// Load only the local environment file.
dotenv.config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth-routes');
const googleAuthRoutes = require('./routes/google-auth-routes');
const predictionRoutes = require('./routes/prediction-routes');
const adminRoutes = require('./routes/admin-routes');
const staffRoutes = require('./routes/staff-routes');
const userRoutes = require('./routes/user-routes');
const aiRoutes = require('./routes/ai-routes');
const messageRoutes = require('./routes/message-routes');
const plantRoutes = require('./routes/plant-routes');
const reservationRoutes = require('./routes/reservation-routes');
const uploadRoutes = require('./routes/upload-routes');
const communityRoutes = require('./routes/community-routes');
const paymentRoutes = require('./routes/payment-routes');
const paymentController = require('./controllers/payment-controller');
const analyticsRoutes = require('./routes/analytics-routes');
const chatRoutes = require('./routes/chat-routes');
const { decodeRequestIdentifiers } = require('./middleware/public-identifiers');
const { healthLimiter } = require('./middleware/rate-limit');
const { buildAllowedOrigins, shouldAllowOrigin } = require('./utils/cors-origins');
const { optionalAuth } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/error-handler');
const ensureEventPaymentSchema = require('./database/ensure-event-payment-schema');
const ensureAIAssistSchema = require('./database/ensure-ai-assist-schema');
const ensureAuthSchema = require('./database/ensure-auth-schema');
const ensureSiteVisitSchema = require('./database/ensure-site-visit-schema');
const ensureUserActivitySchema = require('./database/ensure-user-activity-schema');
const ensureStaffActivitySchema = require('./database/ensure-staff-activity-schema');
const ensureNotificationSchema = require('./database/ensure-notification-schema');
const ensureTrashSchema = require('./database/ensure-trash-schema');
const ensureChatSchema = require('./database/ensure-chat-schema');
const ensureSupportSchema = require('./database/ensure-support-schema');
const ensureAdminMasterKeySchema = require('./database/ensure-admin-master-key-schema');
const ensureWalkInSchema = require('./database/ensure-walk-in-schema');
const ensureRevokedTokensSchema = require('./database/ensure-revoked-tokens-schema');
const ensureTicketPaymentSchema = require('./database/ensure-ticket-payment-schema');
const { initializeChatSocket } = require('./socket/chat-socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Trust exactly the number of reverse proxies in front of this process.
// The default of 1 matches the usual single-proxy deploy (nginx, Render,
// Vercel, Fly). Set TRUST_PROXY_HOPS=0 if the app is exposed directly,
// otherwise a client can spoof X-Forwarded-For and bypass IP-based rate limits.
const TRUST_PROXY_HOPS = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? '1', 10);
app.set('trust proxy', Number.isNaN(TRUST_PROXY_HOPS) ? 1 : TRUST_PROXY_HOPS);

// Security headers. Registered first so they also cover the static /uploads mount.
//
// crossOriginResourcePolicy is the one setting that must not be left at the helmet
// default: the default is same-origin, and the frontend is served from a different
// origin (bulusanzoo.com) while embedding /uploads images directly. The default would
// block every profile picture, community photo and QR code.
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'none'"],       // this API serves JSON only
            baseUri: ["'none'"],
            formAction: ["'none'"],
            frameAncestors: ["'none'"]     // nothing embeds this API
        }
    },
    frameguard: { action: 'deny' },
    strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true
    }
}));

const allowedOrigins = buildAllowedOrigins(process.env);

// Fail closed. The previous check permitted every origin whenever NODE_ENV was
// anything other than 'production', so a missing or misspelled environment
// variable turned into a full cross-origin bypass. Opting out now requires
// setting ALLOW_ANY_ORIGIN=true deliberately.
if (process.env.ALLOW_ANY_ORIGIN === 'true') {
    console.warn('[security] ALLOW_ANY_ORIGIN=true - every origin is permitted. Do not do this in production.');
}

app.use(cors({
    origin: function (origin, callback) {
        if (shouldAllowOrigin(origin, allowedOrigins, process.env)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tab-ID', 'X-Requested-With', 'Idempotency-Key']
}));

app.options('*', cors());

// PayMongo signs the raw request body. This route must be registered before JSON parsing.
app.post('/api/payments/paymongo/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(decodeRequestIdentifiers);

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ||
            filePath.endsWith('.png') || filePath.endsWith('.webp') ||
            filePath.endsWith('.gif')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

app.use('/api/auth', authRoutes);
app.use('/auth', googleAuthRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', healthLimiter, optionalAuth, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const health = {
        success: true,
        message: 'Bulusan Zoo API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    };
    // The detailed report exposes database and email-delivery state, so it is only
    // available to signed-in staff. The plain probe stays public so uptime checks
    // keep working without credentials.
    if (req.query.full === 'true') {
        const isPrivileged = req.user && ['admin', 'staff'].includes(req.user.role);
        if (!isPrivileged) {
            return res.status(401).json({ success: false, message: 'Not authorized to view service diagnostics.' });
        }
        // Inside the `full` guard: the unauthenticated health check must not expose
        // operational delivery detail.
        try {
            const db = require('./config/database');
            await db.query('SELECT 1');
            health.database = 'connected';
        } catch (error) {
            health.database = 'disconnected';
            health.success = false;
        }
        health.email = require('./models/notification-model').emailDeliveryStats();
    }
    res.status(health.success ? 200 : 503).json(health);
});

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to Bulusan Zoo API',
        version: '1.0.0'
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

const schemaInitializers = [ensureTicketPaymentSchema, ensureEventPaymentSchema, ensureAIAssistSchema, ensureAuthSchema, ensureSiteVisitSchema, ensureUserActivitySchema, ensureStaffActivitySchema, ensureNotificationSchema, ensureTrashSchema, ensureChatSchema, ensureSupportSchema, ensureAdminMasterKeySchema, ensureWalkInSchema, ensureRevokedTokensSchema];

initializeChatSocket(server, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
});

schemaInitializers.reduce((initialization, initializeSchema) => initialization.then(initializeSchema), Promise.resolve())
    .catch(error => console.error('Database schema initialization failed:', error.message))
    .finally(() => {
        server.listen(PORT, HOST, () => {
            console.info(`Server started on ${HOST}:${PORT}`);
        });
    });

process.on('unhandledRejection', () => {
    console.error('Unhandled rejection');
    process.exit(1);
});

module.exports = app;
