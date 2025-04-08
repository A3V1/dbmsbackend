const express = require('express');
const router = express.Router();
const db = require('../dbConfig.js');
// Emergency Alerts Management

router.get('/', async (req, res) => { 
    try {
        // Select only the columns needed by the frontend
        const query = 'SELECT * from activity_log';
        const [results] = await db.query(query);

        if (results.length === 0) {
            return res.status(404).json({ message: 'No emergency alerts found' });
        }

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching emergency alerts from database:', error);
        res.status(500).json({ message: 'Error fetching emergency alerts from database' });
    }
});

module.exports = router;

