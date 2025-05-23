const express = require('express');
const router = express.Router();
const db = require('../dbConfig.js');
// Emergency Alerts Management

router.get('/', async (req, res) => { 
    try {
        // Select only the columns needed by the frontend
        const query = 'SELECT * from achievement';
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

// GET /api/achievement/mentee/:menteeId - Get achievements for a specific mentee
router.get('/mentee/:menteeId', async (req, res) => {
    const menteeId = req.params.menteeId;
    if (!menteeId || isNaN(parseInt(menteeId))) {
        return res.status(400).json({ message: 'Invalid mentee ID' });
    }

    try {
        const query = 'SELECT achvmt_id, title, description, date_awarded, badge_icon FROM achievement WHERE mentee_id = ? ORDER BY date_awarded DESC';
        const [results] = await db.query(query, [menteeId]);

        // It's okay if a mentee has no achievements, return an empty array
        res.status(200).json(results);
    } catch (error) {
        console.error(`Error fetching achievements for mentee ${menteeId}:`, error);
        res.status(500).json({ message: 'Error fetching achievements from database' });
    }
});


// DELETE /api/achievement/:id - Delete an achievement
router.delete('/:id', async (req, res) => {
    const achievementId = req.params.id;
    if (!achievementId || isNaN(parseInt(achievementId))) {
        return res.status(400).json({ message: 'Invalid achievement ID' });
    }

    try {
        const query = 'DELETE FROM achievement WHERE achvmt_id = ?';
        const [result] = await db.query(query, [achievementId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Achievement not found or already deleted' });
        }

        res.status(200).json({ message: 'Achievement deleted successfully' });
    } catch (error) {
        console.error(`Error deleting achievement ${achievementId}:`, error);
        // Add foreign key check if necessary, though less likely for achievements unless badges/points link elsewhere
        // if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        //     return res.status(409).json({ message: 'Cannot delete this achievement as it is referenced elsewhere.' });
        // }
        res.status(500).json({ message: 'Error deleting achievement from database' });
    }
});


module.exports = router;
