const express = require('express');
const router = express.Router();
const db = require('../dbConfig.js');

// Get Mentee ID by Unique User Number
router.get('/details-by-user/:unique_user_no', async (req, res) => {
    try {
        const { unique_user_no } = req.params;
        if (!unique_user_no) {
            return res.status(400).json({ message: 'Unique user number parameter is required.' });
        }

        const query = `
            SELECT mentee_id 
            FROM mentee 
            WHERE unique_user_no = ?;
        `;
        const [results] = await db.query(query, [unique_user_no]);

        if (results.length > 0) {
            res.status(200).json({ mentee_id: results[0].mentee_id });
        } else {
            // It's important to distinguish between "not found" and an error
            res.status(404).json({ message: 'Mentee details not found for the given user number.' });
        }
    } catch (error) {
        console.error('Error fetching mentee details by user number:', error);
        res.status(500).json({ message: 'Error fetching mentee details from server.' });
    }
});

// Select Mentee Dropdown
router.get('/mentee-dropdown', async (req, res) => {
    try {
        const { mentorId } = req.query;
        const query = `
            SELECT mentee_id, mentee_email 
            FROM mentor_view 
            WHERE mentor_id = ?; 
        `;
        // Pass parameters as an array for positional placeholders
        const [results] = await db.query(query, [mentorId]); 
        res.status(200).json(results);
    } catch (error) {
        // Log the full error object for more details
        console.error('Detailed error fetching mentee dropdown:', error); 
        res.status(500).json({ message: 'Error fetching mentee dropdown data from server.' }); // Slightly more specific message
    }
});

// Assigned Mentor Info
router.get('/mentor-info', async (req, res) => {
    try {
        const { menteeId } = req.query;
        // Corrected: Select official_mail_id as mentor_name since full_name doesn't exist in users table
        const query = `
            SELECT u.official_mail_id AS mentor_name, u.official_mail_id, m.room_no, m.department, m.timetable
            FROM mentor_view mv
            JOIN mentor m ON mv.mentor_id = m.mentor_id
            JOIN users u ON m.unique_user_no = u.unique_user_no
            WHERE mv.mentee_id = ?;
        `;
        const [results] = await db.query(query, [menteeId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching mentor info:', error);
        res.status(500).json({ message: 'Error fetching mentor info' });
    }
});

// My Academic Progress
router.get('/academic-progress', async (req, res) => {
    try {
        const { menteeId } = req.query;
        const query = `
            SELECT ma.course, ma.year, ma.attendance, ma.academic_context 
            FROM mentee_academic_view ma
            WHERE mentee_id = ?;
        `;
        const [results] = await db.query(query, [menteeId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching academic progress:', error);
        res.status(500).json({ message: 'Error fetching academic progress' });
    }
});

// Communication with Mentor
router.get('/communication', async (req, res) => {
    try {
        const { menteeId } = req.query;
        // Corrected: Query 'communication' table directly as 'communication_view' lacks 'type' and 'timestamp' (sent_at).
        // Use 'message_content' instead of 'message'. Alias 'timestamp' as 'sent_at'.
        const query = `
            SELECT 
                comm.message_content AS message, 
                comm.sender_id, 
                comm.receiver_id, 
                comm.type, 
                comm.message_status, 
                comm.timestamp AS sent_at 
            FROM communication comm  -- Querying communication table directly
            WHERE 
                (comm.sender_id = ? OR comm.receiver_id = ?) 
                AND comm.type IN ('one-to-one', 'feedback')
            ORDER BY comm.timestamp DESC
            LIMIT 5;
        `;
        // Pass menteeId twice for the two placeholders
        const [results] = await db.query(query, [menteeId, menteeId]); 
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching communication:', error); // Keep detailed logging
        res.status(500).json({ message: 'Error fetching communication' });
    }
});

// My Calendar (Upcoming Meetings)
router.get('/calendar', async (req, res) => {
    try {
        const { menteeId } = req.query;
        // Corrected: Query 'communication' table directly. Use 'message_content' and 'timestamp'.
        const query = `
            SELECT comm.message_content AS message, comm.timestamp AS sent_at 
            FROM communication comm
            WHERE 
                (comm.sender_id = ? OR comm.receiver_id = ?) 
                AND comm.type = 'meeting_req'
            ORDER BY comm.timestamp DESC
            LIMIT 1;
        `;
        const [results] = await db.query(query, [menteeId, menteeId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching calendar:', error);
        res.status(500).json({ message: 'Error fetching calendar' });
    }
});

// Emergency Alerts
router.get('/emergency-alerts', async (req, res) => {
    try {
        const { menteeId } = req.query;
        // Corrected: Select 'alert_reason' instead of 'alert_text'. Removed ORDER BY as 'alert_time' doesn't exist.
        const query = `
            SELECT ea.alert_reason, ea.alert_status 
            FROM emergency_alerts ea
            JOIN communication c ON ea.comm_id = c.comm_id
            WHERE 
                (c.sender_id = ? OR c.receiver_id = ?); 
        `;
        const [results] = await db.query(query, [menteeId, menteeId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching emergency alerts:', error);
        res.status(500).json({ message: 'Error fetching emergency alerts' });
    }
});

// My Achievements
router.get('/achievements', async (req, res) => {
    try {
        const { menteeId } = req.query;
        const query = `
            SELECT title, description, date_awarded 
            FROM achievement
            WHERE mentee_id = ? 
            ORDER BY date_awarded DESC;
        `;
        const [results] = await db.query(query, [menteeId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ message: 'Error fetching achievements' });
    }
});

// Feedback Hub
router.get('/feedback', async (req, res) => {
    try {
        const { menteeId } = req.query;
        // Corrected: Query 'communication' table directly. Use 'message_content' and 'timestamp'.
        const query = `
            SELECT comm.message_content AS message, comm.timestamp AS sent_at
            FROM communication comm
            WHERE 
                (comm.sender_id = ? OR comm.receiver_id = ?) 
                AND comm.type = 'feedback'
            ORDER BY comm.timestamp DESC
            LIMIT 1;
        `;
        const [results] = await db.query(query, [menteeId, menteeId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Error fetching feedback' });
    }
});

module.exports = router;
