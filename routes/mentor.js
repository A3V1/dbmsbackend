const express = require('express');
const router = express.Router();
const db = require('../dbConfig.js');
// Emergency Alerts Management

router.get('/', async (req, res) => { 
    try {
        // Select only the columns needed by the frontend
        const query = 'SELECT * from mentor';
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

// GET /api/mentor/details/by-user/:userId - Fetch mentor record by unique_user_no
router.get('/details/by-user/:userId', async (req, res) => {
    const userId = req.params.userId;
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Invalid User ID provided' });
    }

    try {
        const query = 'SELECT * FROM mentor WHERE unique_user_no = ?';
        const [results] = await db.query(query, [userId]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Mentor details not found for this user ID' });
        }

        res.status(200).json(results[0]); // Return the single mentor record object
    } catch (error) {
        console.error(`Error fetching mentor details by user ID ${userId}:`, error);
        res.status(500).json({ message: 'Error fetching mentor details' });
    }
});


// GET /api/mentor/:id - Fetch mentor record by mentor_id (Primary Key)
// Keep this route if it's used elsewhere, e.g., for admin purposes
router.get('/:id', async (req, res) => {
    const mentorId = req.params.id;
     if (!mentorId || isNaN(parseInt(mentorId))) {
        return res.status(400).json({ message: 'Invalid Mentor ID provided' });
    }
    try {
        const query = 'SELECT * FROM mentor WHERE mentor_id = ?';
        const [results] = await db.query(query, [mentorId]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'Mentor not found for this Mentor ID' });
        }
        res.status(200).json(results[0]); // Return the single mentor record object
    } catch (error) {
        console.error(`Error fetching mentor by mentor ID ${mentorId}:`, error);
        res.status(500).json({ message: 'Error fetching mentor details' });
    }
});


// Delete a mentor by ID
router.delete('/:id', async (req, res) => {
    const mentorId = req.params.id; // This ID is mentor_id (PK)
    if (!mentorId) {
        return res.status(400).json({ message: 'Mentor ID is required' });
    }

    try {
        const query = 'DELETE FROM mentor WHERE mentor_id = ?';
        const [result] = await db.query(query, [mentorId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Mentor not found or already deleted' });
        }

        res.status(200).json({ message: 'Mentor deleted successfully' });
    } catch (error) {
        console.error('Error deleting mentor from database:', error);
        // Check for foreign key constraint errors (e.g., ER_ROW_IS_REFERENCED_2)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ message: 'Cannot delete mentor. They might be referenced in other records (e.g., achievements, meetings).' });
        }
        res.status(500).json({ message: 'Error deleting mentor from database' });
    }
});

module.exports = router;
