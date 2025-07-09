// server.js
require('dotenv').config(); // Load .env variables first
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const genericCrudRouter = require('./routes/genericcrud'); // Import router
const mentorRouter = require('./routes/mentor'); // Import mentor router
const usersRouter = require('./routes/users'); // Import the new users router
const alertsRouter = require('./routes/alerts'); // Import the alerts router
const commviewRouter = require('./routes/commview'); // Import the communication view router
const activityRouter = require('./routes/activity');
const achievementRouter = require('./routes/achievement');
const mentorview = require('./routes/mentor-mentee'); // Import the mentor-mentee router
const mentorDashboardRouter = require('./routes/mentor-dashboard'); // Import the mentor dashboard router
const mentee=require('./routes/mentee'); // Import the mentee router
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

// --- Serve Static Files ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads/feedback_pdfs')));
app.use(express.static(path.join(__dirname, 'frontend'))); // Serve static files from the 'frontend' directory
app.use('/img', express.static(path.join(__dirname, 'frontend', 'img'))); // Explicitly serve images
app.use('/js', express.static(path.join(__dirname, 'frontend', 'js'))); // Explicitly serve JavaScript files
app.use('/css', express.static(path.join(__dirname, 'frontend', 'css'))); // Explicitly serve CSS files

// --- API Routes ---

// Test route to check if API is working
app.get('/api/test', (req, res) => {
  console.log('Test API endpoint hit!');
  res.json({ message: 'API is working' });
});

// Mount the new users router *before* the generic one
app.use('/api/users', usersRouter);

// Mount the mentor-specific router
app.use('/api/mentor', mentorRouter);

// Mount the alerts router specifically
app.use('/api/alerts', alertsRouter);

app.use('/api/commview', commviewRouter);

app.use('/api/activity', activityRouter);

app.use('/api/achievement', achievementRouter);

app.use('/api/mentor-mentee', mentorview);

// Mount the mentor dashboard router (needs mentorId handled within the router)
app.use('/api/mentor-dashboard', mentorDashboardRouter);

app.use('/api/mentee', mentee);

// Mount the generic router under /api/:tableName
// validateTableName middleware runs first for these routes
app.use('/api/:tableName', validateTableName, genericCrudRouter);

// --- Basic Root Route ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'mentor-dashboard.html'));
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
