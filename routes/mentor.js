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

// Delete a mentor by ID
router.delete('/:id', async (req, res) => {
    const mentorId = req.params.id;
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
