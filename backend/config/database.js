const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// check environment
const isProduction = process.env.NODE_ENV === 'production';

// ssl config for production
const getSSLConfig = () => {
    if (!isProduction) return false;
    
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
    
    return {
        rejectUnauthorized: rejectUnauthorized,
        minVersion: 'TLSv1.2'
    };
};

// database config
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bulusanzoocalapan',
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
        console.error('DB connection failed');
        return;
    }
    console.info('DB connected');
    connection.release();
});

module.exports = promisePool;
