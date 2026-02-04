const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Check if running in production (Render.com, etc.)
const isProduction = process.env.NODE_ENV === 'production';

// Build SSL configuration for production
// Aiven and similar cloud databases require SSL but may use self-signed certificates
const getSSLConfig = () => {
    if (!isProduction) return false;
    
    // For Aiven: they use self-signed certificates, so we need to disable strict verification
    // This is safe because the connection is still encrypted
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
    
    return {
        rejectUnauthorized: rejectUnauthorized,
        // minVersion is required for some cloud providers
        minVersion: 'TLSv1.2'
    };
};

// Database configuration with SSL support for production
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zoobulusan',
    waitForConnections: true,
    connectionLimit: isProduction ? 5 : 10,
    queueLimit: 0,
    connectTimeout: 60000,
    // Enable SSL for production MySQL connections
    ssl: getSSLConfig()
};

const pool = mysql.createPool(dbConfig);

const promisePool = pool.promise();

pool.getConnection((err, connection) => {
    if (err) {
        console.error('\x1b[31mDatabase connection failed: ' + err.message + '\x1b[0m');
        return;
    }
    console.log('\x1b[32mDatabase connected successfully\x1b[0m');
    connection.release();
});

module.exports = promisePool;
