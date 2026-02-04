const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Check if running in production (Render.com, etc.)
const isProduction = process.env.NODE_ENV === 'production';

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
    // Enable SSL for production MySQL connections (required by most cloud databases)
    ...(isProduction && {
        ssl: {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
        }
    })
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
