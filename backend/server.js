const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
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
const ensureEventPaymentSchema = require('./database/ensure-event-payment-schema');
const ensureAIAssistSchema = require('./database/ensure-ai-assist-schema');
const ensureAuthSchema = require('./database/ensure-auth-schema');
const ensureSiteVisitSchema = require('./database/ensure-site-visit-schema');
const ensureUserActivitySchema = require('./database/ensure-user-activity-schema');
const ensureTrashSchema = require('./database/ensure-trash-schema');
const ensureChatSchema = require('./database/ensure-chat-schema');
const ensureSupportSchema = require('./database/ensure-support-schema');
const ensureAdminMasterKeySchema = require('./database/ensure-admin-master-key-schema');
const ensureWalkInSchema = require('./database/ensure-walk-in-schema');
const { initializeChatSocket } = require('./socket/chat-socket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.set('trust proxy', 1);

const allowedOrigins = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    'https://bulusanzoo.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'capacitor://localhost',
    'https://localhost',
    'https://localhost:8100',
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.some(allowed =>
            allowed instanceof RegExp ? allowed.test(origin) : origin.startsWith(allowed.replace(/\/$/, ''))
        );
        if (isAllowed) return callback(null, true);
        if (process.env.NODE_ENV !== 'production') return callback(null, true);
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

app.get('/api/health', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const health = {
        success: true,
        message: 'Bulusan Zoo API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    };
    if (req.query.full === 'true') {
        try {
            const db = require('./config/database');
            await db.query('SELECT 1');
            health.database = 'connected';
        } catch (error) {
            health.database = 'disconnected';
            health.success = false;
        }
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

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Server error');
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const schemaInitializers = [ensureEventPaymentSchema, ensureAIAssistSchema, ensureAuthSchema, ensureSiteVisitSchema, ensureUserActivitySchema, ensureTrashSchema, ensureChatSchema, ensureSupportSchema, ensureAdminMasterKeySchema, ensureWalkInSchema];

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
