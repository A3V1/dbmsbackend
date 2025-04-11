const express = require('express');
const router = express.Router();
const db = require('../dbConfig.js');

// --- 🧑‍🏫 Get All Mentors for Dropdown ---
// GET /api/mentor-dashboard/mentors
router.get('/mentors', async (req, res) => {
    try {
        const query = `
            SELECT m.mentor_id, u.name AS mentor_name
            FROM mentor m
            JOIN users u ON m.unique_user_no = u.unique_user_no
            ORDER BY u.name;
        `;
        const [mentors] = await db.query(query);
        res.status(200).json(mentors);
    } catch (error) {
        console.error('Error fetching all mentors:', error);
        res.status(500).json({ message: 'Error fetching mentor list from database' });
    }
});


// Helper function to get mentor's unique_user_no from mentor_id
async function getMentorUserNo(mentorId) {
    // Validate mentorId is a number
    if (isNaN(mentorId)) {
        throw new Error('Invalid Mentor ID format');
    }
    const [rows] = await db.query('SELECT unique_user_no FROM mentor WHERE mentor_id = ?', [mentorId]);
    if (rows.length === 0) {
        throw new Error('Mentor not found');
    }
    return rows[0].unique_user_no;
}

// --- 🧑‍🏫 Mentor Details ---
// GET /api/mentor-dashboard/:mentorId/details
router.get('/:mentorId/details', async (req, res) => {
    const { mentorId } = req.params;
    if (isNaN(mentorId)) {
        return res.status(400).json({ message: 'Invalid Mentor ID format' });
    }
    try {
        const query = `
            SELECT m.mentor_id, m.room_no, m.timetable, m.department, m.academic_background, u.official_mail_id -- Removed u.name
            FROM mentor m
            JOIN users u ON m.unique_user_no = u.unique_user_no
            WHERE m.mentor_id = ?;
        `;
        const [details] = await db.query(query, [mentorId]);
        if (details.length === 0) {
            return res.status(404).json({ message: 'Mentor not found' });
        }
        res.status(200).json(details[0]);
    } catch (error) {
        console.error(`Error fetching details for mentor ${mentorId}:`, error);
        res.status(500).json({ message: 'Error fetching mentor details from database' });
    }
});


// --- 📚 Mentee List & Academic Profiles (using JOIN Query) ---
// GET /api/mentor-dashboard/:mentorId/mentees
router.get('/:mentorId/mentees', async (req, res) => {
    const { mentorId } = req.params;
     if (isNaN(mentorId)) {
        return res.status(400).json({ message: 'Invalid Mentor ID format' });
    }
    try {
        // Use the provided JOIN query
        const query = `
            SELECT mav.mentee_id, mav.mentee_email, mav.course, mav.year, mav.attendance, mav.academic_context, u.profile_picture -- Replaced u.profile_pic_url with u.profile_picture
            FROM mentor_view mv
            JOIN mentee_academic_view mav ON mv.mentee_id = mav.mentee_id
            JOIN mentee me ON mav.mentee_id = me.mentee_id  -- Join mentee table
            JOIN users u ON me.unique_user_no = u.unique_user_no -- Join users table for name/pic
            WHERE mv.mentor_id = ?;
        `;
        const [mentees] = await db.query(query, [mentorId]);
        res.status(200).json(mentees);
    } catch (error) {
        console.error(`Error fetching mentees for mentor ${mentorId}:`, error.message); // Log specific error message
        console.error('DB Error Details:', error); // Log the full error object
        res.status(500).json({ message: 'Error fetching mentee data from database', error: error.message }); // Include error in response (optional, for debugging)
    }
});


// --- 🗓️ Meeting Scheduler & Agenda (Existing - Keep as is for now) ---
// GET /api/mentor-dashboard/:mentorId/meetings
router.get('/:mentorId/meetings', async (req, res) => {
    const { mentorId } = req.params;
    try {
        const mentorUserNo = await getMentorUserNo(mentorId);
        // Fetch meetings (assuming type='meeting_req' in communication) involving the mentor
        // Keep existing query as procedure doesn't specifically filter for meetings
        const query = `
            SELECT
                c.comm_id,
                c.sender_id,
                su.official_mail_id AS sender_email,
                c.receiver_id,
                ru.official_mail_id AS receiver_email,
                c.message_content,
                c.message_status,
                c.timestamp,
                c.attached_file
            FROM communication c
            JOIN users su ON c.sender_id = su.unique_user_no
            JOIN users ru ON c.receiver_id = ru.unique_user_no
            WHERE c.type = 'meeting_req'
              AND (c.sender_id = ? OR c.receiver_id = ?)
            ORDER BY c.timestamp DESC;
        `;
        const [meetings] = await db.query(query, [mentorUserNo, mentorUserNo]);
        res.status(200).json(meetings);
    } catch (error) {
        console.error(`Error fetching meetings for mentor ${mentorId}:`, error);
        if (error.message === 'Mentor not found' || error.message === 'Invalid Mentor ID format') {
            return res.status(404).json({ message: 'Mentor not found or invalid ID.' });
        }
        res.status(500).json({ message: 'Error fetching meeting data' });
    }
});

// --- 📊 Communication Statistics ---
// GET /api/mentor-dashboard/:mentorId/communication-stats
router.get('/:mentorId/communication-stats', async (req, res) => {
    const { mentorId } = req.params;
    try {
        const mentorUserNo = await getMentorUserNo(mentorId);
        const query = `
            SELECT type, message_status, COUNT(*) AS total_messages
            FROM communication
            WHERE sender_id = ? OR receiver_id = ?
            GROUP BY type, message_status;
        `;
        const [stats] = await db.query(query, [mentorUserNo, mentorUserNo]);
        res.status(200).json(stats);
    } catch (error) {
        console.error(`Error fetching communication stats for mentor ${mentorId}:`, error);
        if (error.message === 'Mentor not found' || error.message === 'Invalid Mentor ID format') {
            return res.status(404).json({ message: 'Mentor not found or invalid ID.' });
        }
        res.status(500).json({ message: 'Error fetching communication statistics' });
    }
});


// --- 💬 Recent Communications (using communication_view) ---
// GET /api/mentor-dashboard/:mentorId/communications
router.get('/:mentorId/communications', async (req, res) => {
    const { mentorId } = req.params;
    try {
        const mentorUserNo = await getMentorUserNo(mentorId);
        // Use the communication_view query provided
        // Assuming 'timestamp' column exists in communication_view. If not, remove ORDER BY or use a different column.
        const query = `
            SELECT *
            FROM communication_view
            WHERE sender_id = ? OR receiver_id = ?
            LIMIT 10; -- Removed ORDER BY timestamp DESC
        `;
        const [communications] = await db.query(query, [mentorUserNo, mentorUserNo]);
        res.status(200).json(communications);
    } catch (error) {
        console.error(`Error fetching communications for mentor ${mentorId}:`, error.message); // Log specific error message
        console.error('DB Error Details:', error); // Log the full error object
        // Removed the specific timestamp error handling as we removed the ORDER BY clause
        if (error.message === 'Mentor not found' || error.message === 'Invalid Mentor ID format') {
            return res.status(404).json({ message: 'Mentor not found or invalid ID.' });
        }
        res.status(500).json({ message: 'Error fetching communication data', error: error.message }); // Include error in response (optional, for debugging)
    }
});


// --- 🏆 Achievement Management (using provided JOIN Query) ---
// GET /api/mentor-dashboard/:mentorId/achievements
router.get('/:mentorId/achievements', async (req, res) => {
    const { mentorId } = req.params;
     if (isNaN(mentorId)) {
        return res.status(400).json({ message: 'Invalid Mentor ID format' });
    }
    try {
        // Use the provided JOIN query
        const query = `
            SELECT
                a.achvmt_id, -- Assuming achievement table has primary key achvmt_id
                a.mentee_id,
                u.official_mail_id AS mentee_email,
                a.title,
                a.description,
                a.date_awarded,
                a.badge_icon
            FROM achievement a
            JOIN mentee m ON a.mentee_id = m.mentee_id
            JOIN users u ON m.unique_user_no = u.unique_user_no
            WHERE a.mentor_id = ?
            ORDER BY a.date_awarded DESC; -- Order as per example if needed
        `;
        const [achievements] = await db.query(query, [mentorId]);
        res.status(200).json(achievements);
    } catch (error) {
        console.error(`Error fetching achievements for mentor ${mentorId}:`, error);
        res.status(500).json({ message: 'Error fetching achievement data' });
    }
});


// --- 📈 Academic Monitoring Dashboard (Existing - Keep as is, uses procedure results) ---
// GET /api/mentor-dashboard/:mentorId/academic-summary
router.get('/:mentorId/academic-summary', async (req, res) => {
     const { mentorId } = req.params;
    try {
        // Call the stored procedure to get the raw academic data
        const procedureQuery = `CALL get_mentor_mentees_academics(?)`;
        const [results] = await db.query(procedureQuery, [mentorId]);
        const academicData = results[0]; // Data from the procedure

        // Perform aggregation in JavaScript as before, using the procedure results
        // The procedure returns: mentee_id, mentee_email, course, year, attendance, academic_context
        const summary = {
            totalMentees: academicData.length,
            averageAttendance: academicData.length > 0
                ? (academicData.reduce((sum, item) => sum + (item.attendance || 0), 0) / academicData.length).toFixed(2)
                : 0,
            performanceCounts: academicData.reduce((counts, item) => {
                const context = item.academic_context || 'Unknown';
                counts[context] = (counts[context] || 0) + 1;
                return counts;
            }, {}),
            yearCounts: academicData.reduce((counts, item) => {
                const year = item.year || 'Unknown';
                counts[year] = (counts[year] || 0) + 1;
                return counts;
            }, {}),
            underperformingAlerts: academicData.filter(item => item.academic_context === 'Poor' || (item.attendance !== null && item.attendance < 65)).length, // Example threshold
            rawData: academicData // Include raw data if needed for frontend charts
        };

        res.status(200).json(summary);
    } catch (error) {
        console.error(`Error fetching academic summary for mentor ${mentorId} using procedure:`, error);
        res.status(500).json({ message: 'Error fetching academic summary data' });
    }
});


// --- 🧾 Feedback Inbox & Outbox (using Stored Procedure - filtered in JS) ---
// GET /api/mentor-dashboard/:mentorId/feedback
router.get('/:mentorId/feedback', async (req, res) => {
    const { mentorId } = req.params;
    try {
        const mentorUserNo = await getMentorUserNo(mentorId);
        // Call the general communications procedure
        const query = `CALL get_mentor_communications_emergencies(?)`;
        const [results] = await db.query(query, [mentorUserNo]);
        const allComms = results[0];

        // Filter for feedback received by the mentor in JavaScript
        const feedback = allComms.filter(comm => comm.type === 'feedback' && comm.receiver_id === mentorUserNo);

        // Note: This approach fetches all communications and then filters.
        // If performance is critical, a dedicated feedback procedure might be better.
        res.status(200).json(feedback);
    } catch (error) {
        console.error(`Error fetching feedback for mentor ${mentorId} using procedure:`, error);
         if (error.message === 'Mentor not found' || error.message === 'Invalid Mentor ID format') {
            return res.status(404).json({ message: 'Mentor not found or invalid ID.' });
        }
        res.status(500).json({ message: 'Error fetching feedback data' });
    }
});

// --- 🚨 Pending Emergency Alerts ---
// GET /api/mentor-dashboard/:mentorId/pending-alerts
router.get('/:mentorId/pending-alerts', async (req, res) => {
    const { mentorId } = req.params;
    try {
        const mentorUserNo = await getMentorUserNo(mentorId);
        const query = `
            SELECT ea.emergency_alert_id, ea.comm_id, ea.alert_reason, ea.alert_status, c.sender_id, c.receiver_id
            FROM emergency_alerts ea
            JOIN communication c ON ea.comm_id = c.comm_id
            WHERE ea.alert_status = 'pending'
              AND (c.sender_id = ? OR c.receiver_id = ?);
        `;
        const [alerts] = await db.query(query, [mentorUserNo, mentorUserNo]);
        res.status(200).json(alerts);
    } catch (error) {
        console.error(`Error fetching pending alerts for mentor ${mentorId}:`, error);
        if (error.message === 'Mentor not found' || error.message === 'Invalid Mentor ID format') {
            return res.status(404).json({ message: 'Mentor not found or invalid ID.' });
        }
        res.status(500).json({ message: 'Error fetching pending emergency alerts' });
    }
});


// --- 📌 Activity Tracker (Existing - Keep as is) ---
// GET /api/mentor-dashboard/:mentorId/activity
router.get('/:mentorId/activity', async (req, res) => {
    const { mentorId } = req.params;
    try {
        const mentorUserNo = await getMentorUserNo(mentorId);
        // Fetch activity log entries for the mentor
        const query = `
            SELECT
                log_id,
                activity,
                log_time,
                ip_address,
                last_login -- Added last_login as per user query
            FROM activity_log
            WHERE user_id = ?
            ORDER BY log_time DESC
            LIMIT 5; -- Limit results to 5 as per user query
        `;
        const [activity] = await db.query(query, [mentorUserNo]);
        res.status(200).json(activity);
    } catch (error) {
        console.error(`Error fetching activity log for mentor ${mentorId}:`, error);
         if (error.message === 'Mentor not found' || error.message === 'Invalid Mentor ID format') {
            return res.status(404).json({ message: 'Mentor not found or invalid ID.' });
        }
        res.status(500).json({ message: 'Error fetching activity log data' });
    }
});


// --- Notes & Resources Hub Route Removed ---


// --- POST/PUT/DELETE Endpoints (Examples - Need Implementation) ---

// POST /api/mentor-dashboard/:mentorId/meetings (Schedule a new meeting)
router.post('/:mentorId/meetings', async (req, res) => {
    // Needs implementation: Validate input, insert into communication table with type='meeting_req'
    res.status(501).json({ message: 'Scheduling meeting not implemented yet.' });
});

// POST /api/mentor-dashboard/:mentorId/communications (Send a message)
router.post('/:mentorId/communications', async (req, res) => {
    // Needs implementation: Validate input, insert into communication table
    res.status(501).json({ message: 'Sending message not implemented yet.' });
});

// POST /api/mentor-dashboard/:mentorId/achievements (Award an achievement)
router.post('/:mentorId/achievements', async (req, res) => {
    const { mentorId } = req.params;
    const { mentee_id, title, description, date_awarded, badge_icon } = req.body;

    // Basic Validation
    if (!mentee_id || !title || !date_awarded) {
        return res.status(400).json({ message: 'Missing required fields: mentee_id, title, date_awarded are required.' });
    }

    // Optional: Add validation to ensure the mentor is actually mentoring this mentee_id
    // This would involve checking the mentee table or mentor_view

    try {
        const query = `
            INSERT INTO achievement (mentor_id, mentee_id, title, description, date_awarded, badge_icon)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        const [result] = await db.query(query, [
            mentorId,
            mentee_id,
            title,
            description || null, // Allow null description
            date_awarded,
            badge_icon || null // Allow null badge_icon
        ]);

        if (result.affectedRows === 1) {
            res.status(201).json({ message: 'Achievement awarded successfully.', achievementId: result.insertId });
        } else {
            throw new Error('Failed to insert achievement record.');
        }
    } catch (error) {
        console.error(`Error awarding achievement for mentor ${mentorId} to mentee ${mentee_id}:`, error);
        // Check for foreign key constraint errors (e.g., invalid mentee_id or mentor_id)
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: 'Invalid mentee_id or mentor_id provided.' });
        }
        res.status(500).json({ message: 'Error saving achievement data to database.' });
    }
});


// PUT /api/mentor-dashboard/:mentorId/alerts/:alertId (Update alert status)
// This route might still be needed if you want to update an alert's status,
// even though fetching is merged. Keeping it commented for now.
// router.put('/:mentorId/alerts/:alertId', async (req, res) => {
//     // Needs implementation: Validate input, update emergency_alerts table
//     res.status(501).json({ message: 'Updating alert status not implemented yet.' });
// });

// DELETE /api/mentor-dashboard/achievements/:achievementId (Delete an achievement)
// Note: We don't include mentorId in the route as achievementId should be unique
router.delete('/achievements/:achievementId', async (req, res) => {
    const { achievementId } = req.params;

    if (isNaN(achievementId)) {
        return res.status(400).json({ message: 'Invalid Achievement ID format.' });
    }

    try {
        const query = `DELETE FROM achievement WHERE achvmt_id = ?;`;
        const [result] = await db.query(query, [achievementId]);

        if (result.affectedRows === 1) {
            res.status(200).json({ message: 'Achievement deleted successfully.' });
        } else {
            // If no rows were affected, the achievement ID likely didn't exist
            res.status(404).json({ message: 'Achievement not found or already deleted.' });
        }
    } catch (error) {
        console.error(`Error deleting achievement ${achievementId}:`, error);
        // Handle potential foreign key constraint issues if needed, though less likely on DELETE
        res.status(500).json({ message: 'Error deleting achievement from database.' });
    }
});


module.exports = router;
