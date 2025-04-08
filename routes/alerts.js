const express = require('express');
const router = express.Router();
const db = require('../dbConfig.js');
// Emergency Alerts Management

router.get('/', async (req, res) => { 
    try {
        // Select only the columns needed by the frontend
        const query = 'SELECT emergency_alert_id, comm_id, alert_reason, alert_status FROM emergency_alerts';
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

// GET /api/alerts/count/pending - Get count of pending alerts
router.get('/count/pending', async (req, res) => {
    try {
        const [result] = await db.query("SELECT COUNT(*) as count FROM emergency_alerts WHERE alert_status = 'pending'");
        res.status(200).json(result[0]); // { count: N }
    } catch (error) {
        console.error('Error fetching pending alert count:', error);
        res.status(500).json({ message: 'Error fetching pending alert count' });
    }
});

// DELETE /api/alerts/:id - Delete an emergency alert
router.delete('/:id', async (req, res) => {
    const alertId = req.params.id;
    if (!alertId || isNaN(parseInt(alertId))) {
        return res.status(400).json({ message: 'Invalid alert ID' });
    }

    try {
        const [result] = await db.query('DELETE FROM emergency_alerts WHERE emergency_alert_id = ?', [alertId]);

        if (result.affectedRows === 1) {
            res.status(200).json({ message: 'Alert deleted successfully' });
        } else {
            res.status(404).json({ message: 'Alert not found or already deleted' });
        }
    } catch (error) {
        console.error(`Error deleting alert ${alertId}:`, error);
        // Check for foreign key constraints if applicable
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ message: 'Cannot delete this alert as it is referenced elsewhere.' });
        }
        res.status(500).json({ message: 'Error deleting alert from database' });
    }
});

module.exports = router;
