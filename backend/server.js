const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');

// Load .env from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth-routes');
const googleAuthRoutes = require('./routes/google-auth-routes');
const predictionRoutes = require('./routes/prediction-routes');
const adminRoutes = require('./routes/admin-routes');
const staffRoutes = require('./routes/staff-routes');
const userRoutes = require('./routes/user-routes');
const aiRoutes = require('./routes/ai-routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render.com and other reverse proxies
app.set('trust proxy', 1);

// CORS configuration for production
const allowedOrigins = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    'https://bulusanzoo.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
            return callback(null, true);
        }
        
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tab-ID', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    setHeaders: (res, filePath) => {
        // Set proper cache headers for images
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || 
            filePath.endsWith('.png') || filePath.endsWith('.webp') || 
            filePath.endsWith('.gif')) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
        }
    }
}));

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    // Production logging - combined format
    app.use(morgan('combined'));
}

app.use('/api/auth', authRoutes);
app.use('/auth', googleAuthRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint for monitoring and load balancers
app.get('/api/health', async (req, res) => {
    const health = {
        success: true,
        message: 'Zoo Bulusan API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime()
    };

    // Optionally check database connectivity
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
        message: 'Welcome to Zoo Bulusan API',
        version: '1.0.0'
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});

module.exports = app;