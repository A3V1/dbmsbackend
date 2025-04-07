// server.js
require('dotenv').config(); // Load .env variables first
const express = require('express');
const cors = require('cors');
const genericCrudRouter = require('./routes/genericcrud'); // Import router

const app = express();
const PORT = process.env.PORT || 3000;

// --- UPDATED: Define Your Allowed Table Names ---
// This list now contains the actual names of your 12 tables.
const ALLOWED_TABLES = [
    'achievement',
    'activity_log',
    'admin',
    'communication',
    'communication_view',
    'emergency_alerts',
    'mentee',
    'mentee_academic_view',
    'mentee_academics',
    'mentor',
    'mentor_view',
    'users'
];

// Middleware to validate the requested table name
const validateTableName = (req, res, next) => {
    const { tableName } = req.params;
    if (!ALLOWED_TABLES.includes(tableName)) {
        // Forbidden access if table name isn't in the allowed list
        return res.status(403).json({ message: `Access to table '${tableName}' is forbidden.` });
    }
    // Table name is valid, proceed to the generic router
    next();
};

// --- Global Middleware ---
app.use(cors()); // Enable CORS for frontend requests (configure appropriately for production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// --- Serve Static Frontend Files ---
app.use(express.static('frontend')); // Serve static files from the 'frontend' directory

// --- API Routes ---
// Mount the generic router under /api/:tableName
// validateTableName middleware runs first for these routes
app.use('/api/:tableName', validateTableName, genericCrudRouter);

// --- Basic Root Route ---
app.get('/', (req, res) => {
    res.status(200).send('Backend API for 12 tables is running!');
});

// --- Basic Not Found Handler (should be last route) ---
 app.use((req, res, next) => {
    res.status(404).json({ message: 'Resource not found.' });
});

// --- Global Error Handler (should be last middleware) ---
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack || err);
    // Avoid sending detailed errors in production
    res.status(500).json({ message: 'An unexpected error occurred on the server.' });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Access allowed for tables: ${ALLOWED_TABLES.join(', ')}`);
    // Displaying current time as requested in context
    console.log(`Server started at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
});
