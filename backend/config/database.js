const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zoobulusan',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

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
