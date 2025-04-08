// routes/mentor.js
const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');

// Helper function to get primary key field for a table
function getPrimaryKeyField(tableName) {
    const primaryKeys = {
        'mentor': 'mentor_id',
        'mentee': 'mentee_id',
        'achievement': 'achvmt_id',
        'communication': 'comm_id',
        'emergency_alerts': 'emergency_alert_id',
        'mentee_academics': 'mentee_id'
    };
    return primaryKeys[tableName] || 'id';
}

// GET /api/mentor/profile/:id - Get mentor profile
router.get('/profile/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Get mentor details
        const [mentorRows] = await pool.query(
            'SELECT m.*, u.official_mail_id, u.phone_num, u.prn_id, u.profile_picture ' +
            'FROM mentor m ' +
            'JOIN users u ON m.unique_user_no = u.unique_user_no ' +
            'WHERE m.mentor_id = ?', 
            [id]
        );

        if (mentorRows.length === 0) {
            return res.status(404).json({ message: `Mentor with ID ${id} not found` });
        }

        res.json(mentorRows[0]);
    } catch (error) {
        console.error(`Error fetching mentor profile:`, error);
        res.status(500).json({ message: `Error fetching mentor profile` });
    }
});

// PUT /api/mentor/profile/:id - Update mentor profile
router.put('/profile/:id', async (req, res) => {
    const { id } = req.params;
    const { room_no, timetable, department, academic_background, phone_num, profile_picture } = req.body;
    
    try {
        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        try {
            // Update mentor table
            const mentorData = {};
            if (room_no !== undefined) mentorData.room_no = room_no;
            if (timetable !== undefined) mentorData.timetable = timetable;
            if (department !== undefined) mentorData.department = department;
            if (academic_background !== undefined) mentorData.academic_background = academic_background;
            
            if (Object.keys(mentorData).length > 0) {
                await connection.query(
                    'UPDATE mentor SET ? WHERE mentor_id = ?',
                    [mentorData, id]
                );
            }
            
            // Get unique_user_no for the mentor
            const [mentorRows] = await connection.query(
                'SELECT unique_user_no FROM mentor WHERE mentor_id = ?',
                [id]
            );
            
            if (mentorRows.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ message: `Mentor with ID ${id} not found` });
            }
            
            const unique_user_no = mentorRows[0].unique_user_no;
            
            // Update users table
            const userData = {};
            if (phone_num !== undefined) userData.phone_num = phone_num;
            if (profile_picture !== undefined) userData.profile_picture = profile_picture;
            
            if (Object.keys(userData).length > 0) {
                await connection.query(
                    'UPDATE users SET ? WHERE unique_user_no = ?',
                    [userData, unique_user_no]
                );
            }
            
            await connection.commit();
            connection.release();
            
            res.json({ message: `Mentor profile updated successfully` });
        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error(`Error updating mentor profile:`, error);
        res.status(500).json({ message: `Error updating mentor profile` });
    }
});

// GET /api/mentor/mentees/:mentorId - Get mentees for a specific mentor with academic details
router.get('/mentees/:mentorId', async (req, res) => {
    const mentorId = req.params.mentorId;
    
    try {
        // Using the provided query for mentees with academic details
        const query = `
            SELECT mav.*
            FROM mentee_academic_view AS mav
            JOIN mentor_view AS mv ON mav.mentee_id = mv.mentee_id
            WHERE mv.mentor_id = ?`;
        
        const [mentees] = await pool.query(query, [mentorId]);
        
        res.json(mentees);
    } catch (error) {
        console.error('Error fetching mentees:', error);
        res.status(500).json({ error: 'Failed to fetch mentees' });
    }
});

// GET /api/mentor/messages/:mentorId - Get messages for a specific mentor
router.get('/messages/:mentorId', async (req, res) => {
    const mentorId = req.params.mentorId;
    
    try {
        // Updated query to use official_mail_id instead of first_name
        const query = `
            SELECT c.*, u_from.official_mail_id AS sender_name, u_to.official_mail_id AS receiver_name
            FROM communication c
            JOIN users u_from ON c.sender_id = u_from.unique_user_no
            JOIN users u_to ON c.receiver_id = u_to.unique_user_no
            WHERE c.sender_id = ? OR c.receiver_id = ?
            ORDER BY c.timestamp DESC`;
        
        const [messages] = await pool.query(query, [mentorId, mentorId]);
        
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// GET /api/mentor/broadcast-messages/:mentorId - Get broadcast messages sent by a mentor
router.get('/broadcast-messages/:mentorId', async (req, res) => {
    const mentorId = req.params.mentorId;
    
    try {
        // Using the provided query for broadcast messages
        const query = `
            SELECT *
            FROM communication
            WHERE sender_id = ? AND receiver_id IS NULL
            ORDER BY timestamp DESC`;
        
        const [messages] = await pool.query(query, [mentorId]);
        
        res.json(messages);
    } catch (error) {
        console.error('Error fetching broadcast messages:', error);
        res.status(500).json({ error: 'Failed to fetch broadcast messages' });
    }
});

// GET /api/mentor/activity-logs/:mentorId - Get activity logs for a mentor's mentees
router.get('/activity-logs/:mentorId', async (req, res) => {
    const mentorId = req.params.mentorId;
    
    try {
        // Updated query to use official_mail_id instead of first_name
        const query = `
            SELECT al.*, u.official_mail_id AS mentee_name
            FROM activity_log al
            JOIN users u ON al.user_id = u.unique_user_no
            WHERE al.user_id IN (
                SELECT mentee_id FROM mentee WHERE mentor_id = ?
            )
            ORDER BY al.log_time DESC`;
        
        const [logs] = await pool.query(query, [mentorId]);
        
        res.json(logs);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});

// GET /api/mentor/achievements/:mentorId - Get achievements for a mentor's mentees
router.get('/achievements/:mentorId', async (req, res) => {
    const mentorId = req.params.mentorId;
    
    try {
        // Updated query to use date_awarded instead of date_submitted
        const query = `
            SELECT a.*, u.official_mail_id AS mentee_name
            FROM achievement a
            JOIN users u ON a.mentee_id = u.unique_user_no
            WHERE a.mentee_id IN (
                SELECT mentee_id FROM mentee WHERE mentor_id = ?
            )
            ORDER BY a.date_awarded DESC`;
        
        const [achievements] = await pool.query(query, [mentorId]);
        
        res.json(achievements);
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});

// POST /api/mentor/mentee/add - Assign a mentee to a mentor
router.post('/mentee/add', async (req, res) => {
    const { mentorId, menteeEmail } = req.body;
    
    if (!mentorId || !menteeEmail) {
        return res.status(400).json({ error: 'Mentor ID and mentee email are required' });
    }
    
    try {
        // First, check if the mentee exists and get their unique_user_no
        const [menteeUsers] = await pool.query(
            'SELECT unique_user_no FROM users WHERE official_mail_id = ? AND role = "mentee"',
            [menteeEmail]
        );
        
        if (menteeUsers.length === 0) {
            return res.status(404).json({ error: 'Mentee not found or email is not associated with a mentee account' });
        }
        
        const menteeId = menteeUsers[0].unique_user_no;
        
        // Check if the mentee is already assigned to a mentor
        const [existingMentee] = await pool.query(
            'SELECT * FROM mentee WHERE mentee_id = ?',
            [menteeId]
        );
        
        if (existingMentee.length > 0) {
            // Mentee exists, update their mentor
            await pool.query(
                'UPDATE mentee SET mentor_id = ? WHERE mentee_id = ?',
                [mentorId, menteeId]
            );
            return res.json({ message: 'Mentee reassigned to new mentor successfully' });
        } else {
            // Mentee doesn't exist in mentee table, insert new record
            await pool.query(
                'INSERT INTO mentee (mentee_id, mentor_id) VALUES (?, ?)',
                [menteeId, mentorId]
            );
            
            // Initialize mentee academics
            await pool.query(
                'INSERT INTO mentee_academics (mentee_id, semester, gpa, attendance_percentage) VALUES (?, 1, 0.0, 100)',
                [menteeId]
            );
            
            return res.json({ message: 'Mentee assigned to mentor successfully' });
        }
    } catch (error) {
        console.error('Error assigning mentee to mentor:', error);
        res.status(500).json({ error: 'Failed to assign mentee to mentor' });
    }
});

// DELETE /api/mentor/mentee/:menteeId - Remove a mentee from a mentor
router.delete('/mentee/:menteeId', async (req, res) => {
    const menteeId = req.params.menteeId;
    const { mentorId } = req.body;
    
    if (!mentorId || !menteeId) {
        return res.status(400).json({ error: 'Mentor ID and mentee ID are required' });
    }
    
    try {
        // Check if the mentee is assigned to the specified mentor
        const [menteeCheck] = await pool.query(
            'SELECT * FROM mentee WHERE mentee_id = ? AND mentor_id = ?',
            [menteeId, mentorId]
        );
        
        if (menteeCheck.length === 0) {
            return res.status(404).json({ error: 'Mentee not found or not assigned to this mentor' });
        }
        
        // Delete the mentee record (this will remove the assignment)
        await pool.query(
            'DELETE FROM mentee WHERE mentee_id = ? AND mentor_id = ?',
            [menteeId, mentorId]
        );
        
        res.json({ message: 'Mentee removed from mentor successfully' });
    } catch (error) {
        console.error('Error removing mentee from mentor:', error);
        res.status(500).json({ error: 'Failed to remove mentee from mentor' });
    }
});

// GET /api/mentor/available-mentees - Get list of mentees not assigned to any mentor
router.get('/available-mentees', async (req, res) => {
    try {
        const query = `
            SELECT u.unique_user_no, u.official_mail_id as email, u.first_name, u.last_name
            FROM users u
            LEFT JOIN mentee m ON u.unique_user_no = m.unique_user_no
            WHERE u.role = 'mentee' AND m.mentee_id IS NULL`;
        
        const [mentees] = await pool.query(query);
        
        // Add default values for display if first_name/last_name are missing
        const availableMentees = mentees.map(mentee => ({
            ...mentee,
            first_name: mentee.first_name || mentee.email.split('@')[0].replace(/[0-9]/g, ''),
            last_name: mentee.last_name || ''
        }));
        
        res.json(availableMentees);
    } catch (error) {
        console.error('Error fetching available mentees:', error);
        res.status(500).json({ error: 'Failed to fetch available mentees' });
    }
});

// GET /api/mentor/mentee/:menteeId - Get mentee profile by ID
router.get('/mentee/:menteeId', async (req, res) => {
    const menteeId = req.params.menteeId;
    
    try {
        // Get mentee details with academic information
        const query = `
            SELECT m.mentee_id, m.unique_user_no, m.mentor_id, 
                   u.first_name, u.last_name, u.official_mail_id as email, 
                   u.phone_num, u.profile_picture, u.prn_id,
                   ma.semester, ma.gpa, ma.attendance_percentage as attendance,
                   ma.academic_context, ma.academic_background,
                   c.course_name as course, c.year
            FROM mentee m
            JOIN users u ON m.unique_user_no = u.unique_user_no
            LEFT JOIN mentee_academics ma ON m.mentee_id = ma.mentee_id
            LEFT JOIN course c ON u.course_id = c.course_id
            WHERE m.mentee_id = ?`;
        
        const [mentees] = await pool.query(query, [menteeId]);
        
        if (mentees.length === 0) {
            return res.status(404).json({ error: 'Mentee not found' });
        }
        
        res.json(mentees[0]);
    } catch (error) {
        console.error('Error fetching mentee profile:', error);
        res.status(500).json({ error: 'Failed to fetch mentee profile' });
    }
});

// PUT /api/mentor/achievement/:achievementId/approve - Approve an achievement
router.put('/achievement/:achievementId/approve', async (req, res) => {
    const { achievementId } = req.params;
    const { remarks } = req.body;
    
    try {
        // Update achievement status and add remarks
        await pool.query(
            'UPDATE achievement SET status = ?, remarks = ? WHERE achievement_id = ?',
            ['approved', remarks, achievementId]
        );
        
        res.json({ message: 'Achievement approved successfully' });
    } catch (error) {
        console.error('Error approving achievement:', error);
        res.status(500).json({ error: 'Failed to approve achievement' });
    }
});

module.exports = router;
