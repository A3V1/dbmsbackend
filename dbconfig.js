// dbConfig.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Load .env variables

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Max connections in pool
    queueLimit: 0 // Max requests waiting for a connection
});

// Optional check to see if connection is successful on startup
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the MySQL database pool!');
        connection.release(); // Important: release connection back to pool
    })
    .catch(err => {
        console.error('Error connecting to the MySQL database pool:', err);
    });

module.exports = pool; // Export the pool for use elsewhere