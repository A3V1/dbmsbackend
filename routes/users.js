const express = require('express');
const router = express.Router();
const db = require('../dbConfig.js'); // Corrected path and casing for db connection pool

// Test route to check if users router is working
router.get('/test', (req, res) => {
    console.log('Users router test endpoint hit!');
    res.json({ message: 'Users router is working' });
});

// Debug route to check user with ID 11
router.get('/debug/user/11', async (req, res) => {
    try {
        // Direct query to get raw data
        const [rows] = await db.query('SELECT * FROM users WHERE unique_user_no = 11');
        console.log('Raw database data for user 11:', rows);
        
        // Check if there's any data
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User 11 not found in database' });
        }
        
        // Return the raw data
        res.status(200).json({ 
            message: 'Debug data for user 11',
            user: rows[0]
        });
    } catch (error) {
        console.error('Error in debug route for user 11:', error);
        res.status(500).json({ 
            message: 'Error in debug route', 
            error: error.message,
            stack: error.stack
        });
    }
});

// GET /api/users - Fetch all users (specific columns)
router.get('/', async (req, res) => { // Make the handler async to use await with pool
    try {
        // Select only the columns needed by the frontend
        const query = 'SELECT unique_user_no, official_mail_id, prn_id, role, phone_num, created_at FROM users';

        // Use pool.query or pool.execute for async/await
        const [results] = await db.query(query);
        res.status(200).json(results);

    } catch (error) {
        console.error('Error fetching users from database:', error);
        res.status(500).json({ message: 'Error fetching users from database' });
    }
});

// GET /api/users/:id - Fetch user by ID
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        console.log(`GET request for user ID ${userId}`);
        
        // Validate user ID
        if (!userId || isNaN(parseInt(userId))) {
            console.log(`Invalid user ID format: ${userId}`);
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        console.log(`Querying database for user ${userId}...`);
        // Get user details
        const [user] = await db.query('SELECT * FROM users WHERE unique_user_no = ?', [userId]);
        console.log(`Query complete, results:`, user);
        
        if (user.length === 0) {
            console.log(`User ${userId} not found in database`);
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Don't return the password in the response
        const userWithoutPassword = { ...user[0] };
        delete userWithoutPassword.password;
        
        res.status(200).json(userWithoutPassword);
        
    } catch (error) {
        console.error(`Error fetching user ${req.params.id}:`, error);
        res.status(500).json({ 
            message: 'Error fetching user', 
            error: error.message,
            stack: error.stack 
        });
    }
});

// POST /api/users - Create a new user (handles mentee creation via procedure, mentor via transaction)
router.post('/', async (req, res) => {
    let connection; // Define connection outside try block for finally
    try {
        // Extract all potential user data from request body
        const {
            official_mail_id, password, phone_num, prn_id, role, profile_picture,
            // Mentee specific fields
            calendar_id, mentor_id, course, year, attendance, academic_context, academic_background,
            // Mentor specific fields (added)
            room_no, timetable, department // academic_background is reused from mentee fields
        } = req.body;

        // Basic Validation
        if (!official_mail_id || !password || !prn_id || !role) {
            return res.status(400).json({ message: 'Required fields missing: email, password, PRN ID, and role are required.' });
        }

        // Validate role
        if (!['admin', 'mentor', 'mentee'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be admin, mentor, or mentee.' });
        }

        // --- Conditional Logic based on Role ---
        if (role === 'mentee') {
            // --- Call AddNewMentee Stored Procedure ---
            console.log('Attempting to add new mentee via procedure...');

            // Validate required mentee fields received from frontend
            if (mentor_id === undefined || calendar_id === undefined || course === undefined || year === undefined || attendance === undefined || academic_context === undefined || academic_background === undefined) {
                 return res.status(400).json({ message: 'Missing required mentee detail fields (Mentor, Calendar ID, Course, Year, Attendance, Context, Background).' });
            }

            const callQuery = 'CALL AddNewMentee(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const params = [
                official_mail_id,
                password, // Consider hashing this password before storing!
                phone_num || null,
                prn_id,
                calendar_id, // Use the one sent from frontend
                parseInt(mentor_id, 10), // Ensure it's an integer
                course,
                parseInt(year, 10), // Ensure it's an integer
                parseFloat(attendance), // Ensure it's a float/decimal
                academic_context,
                academic_background
            ];

            // Validate numeric conversions
             if (isNaN(params[5]) || isNaN(params[7]) || isNaN(params[8])) {
                 return res.status(400).json({ message: 'Invalid numeric value for Mentor ID, Year, or Attendance.' });
             }

            console.log('Executing AddNewMentee with params:', params);
            const [result] = await db.query(callQuery, params);
            console.log('AddNewMentee procedure result:', result);

            // Check if the procedure indicated success (might vary based on procedure implementation)
            // Often, procedures don't return affectedRows like INSERT. Success might be indicated by lack of error.
            // We might need a more specific check if the procedure returns an output parameter.
            // For now, assume success if no error is thrown.
             console.log(`Mentee ${official_mail_id} potentially added successfully via procedure.`);
             // Since the procedure handles insertion across tables, we might not have a simple new user ID to return.
             // Returning a generic success message might be best unless the procedure provides an output ID.
             res.status(201).json({ message: `Mentee ${official_mail_id} created successfully.` });

        } else {
            // --- Standard User Insert (Admin/Mentor) ---
            console.log(`Attempting to add new ${role}...`);

            // Get a connection for potential transaction (needed for mentor)
            connection = await db.getConnection();
            await connection.beginTransaction();
            console.log(`Transaction started for adding ${role}`);

            // Insert into users table first
            const userInsertQuery = `
                INSERT INTO users
                (official_mail_id, password, phone_num, prn_id, role, profile_picture, calendar_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            // Generate a default calendar ID if not provided for admin/mentor
            const final_calendar_id = calendar_id || `calendar_${role}_${Date.now()}`;

            const [userResult] = await connection.query(userInsertQuery, [
                official_mail_id,
                password, // Consider hashing!
                phone_num || null,
                prn_id,
                role,
                profile_picture || null,
                final_calendar_id
            ]);

            if (userResult.affectedRows !== 1) {
                await connection.rollback();
                console.error(`Failed to insert user ${official_mail_id}. Result:`, userResult);
                throw new Error(`Failed to create user part for ${role}`);
            }

            const newUserId = userResult.insertId;
            console.log(`User ${official_mail_id} inserted successfully with ID ${newUserId}.`);

            // --- Mentor Specific Update (if role is mentor) ---
            // Assumes a trigger creates the initial mentor row upon user insert with role='mentor'
            if (role === 'mentor') {
                console.log(`Updating mentor details for user ID ${newUserId}...`);
                // Validate required mentor fields
                if (room_no === undefined || timetable === undefined || department === undefined || academic_background === undefined) {
                    await connection.rollback();
                    return res.status(400).json({ message: 'Missing required mentor detail fields (Room No, Timetable, Department, Academic Background).' });
                }

                const mentorUpdateQuery = `
                    UPDATE mentor
                    SET room_no = ?, timetable = ?, department = ?, academic_background = ?
                    WHERE unique_user_no = ?
                `;
                const [mentorUpdateResult] = await connection.query(mentorUpdateQuery, [
                    room_no,
                    timetable,
                    department,
                    academic_background, // Reusing the field name
                    newUserId
                ]);

                // Check if the update affected a row. If not, the trigger might have failed or the mentor record doesn't exist.
                if (mentorUpdateResult.affectedRows === 0) {
                     await connection.rollback();
                     console.error(`Failed to update mentor details for user ID ${newUserId}. Mentor record might not exist (trigger issue?).`);
                     // Consider if a direct insert should be attempted here as a fallback, or just error out.
                     // For now, error out as the trigger is expected to create the row.
                     throw new Error('Failed to update mentor details; mentor record not found after user creation.');
                }
                 console.log(`Mentor details updated successfully for user ID ${newUserId}. Result:`, mentorUpdateResult);
            }
            // --- End Mentor Specific Update ---

            // If we reached here, all necessary inserts were successful (or handled)
            await connection.commit();
            console.log(`Transaction committed successfully for adding ${role} ${official_mail_id}.`);

            // Return the newly created user (excluding password)
            const [newUser] = await connection.query('SELECT * FROM users WHERE unique_user_no = ?', [newUserId]);
            const userResponse = { ...newUser[0] };
            delete userResponse.password; // Don't send password back
            res.status(201).json(userResponse);
        }

    } catch (error) {
        console.error(`Error creating user/mentee (${req.body.role}):`, error);

        // Rollback transaction if connection exists and an error occurred
        if (connection) {
            try {
                await connection.rollback();
                console.log('Transaction rolled back due to error.');
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        }

        // Check for duplicate entry errors (primarily for the initial user insert now)
        if (error.code === 'ER_DUP_ENTRY') {
            // Check which constraint caused the error
            if (error.message.includes('users.official_mail_id')) {
                return res.status(409).json({ message: 'Email already exists' });
            }
            if (error.message.includes('users.prn_id')) {
                return res.status(409).json({ message: 'PRN ID already exists' });
            }
            if (error.message.includes('users.calendar_id')) {
                return res.status(409).json({ message: 'Calendar ID already exists' });
            }
             // Duplicate entry on mentor table was handled above, but check just in case
             if (error.message.includes('mentor.unique_user_no')) {
                 console.warn('Duplicate entry error caught for mentor table, should have been handled earlier.');
                 // This might indicate an issue if the trigger handling logic failed
                 return res.status(500).json({ message: 'Internal server error during mentor creation.' });
             }
            return res.status(409).json({ message: 'Duplicate entry error', detail: error.message });
        }

        res.status(500).json({ message: 'Error creating user', error: error.message });
    } finally {
        // Always release the connection
        if (connection) {
            try {
                connection.release();
                console.log('Database connection released.');
            } catch (releaseError) {
                console.error('Error releasing connection:', releaseError);
            }
        }
    }
});

// DELETE /api/users/:id - Delete user by ID (handles role-specific dependencies)
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;
    let connection; // Define connection outside try block for finally

    // Validate user ID
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Invalid user ID' });
    }

    try {
        // Get a connection for transaction
        connection = await db.getConnection();
        await connection.beginTransaction();
        console.log(`Starting transaction to delete user ${userId}`);

        // Check if user exists and get their role
        const [checkUser] = await connection.query('SELECT unique_user_no, role FROM users WHERE unique_user_no = ?', [userId]);

        if (checkUser.length === 0) {
            await connection.rollback(); // Rollback if user not found
            console.log(`User ${userId} not found. Transaction rolled back.`);
            return res.status(404).json({ message: 'User not found' });
        }

        const userToDelete = checkUser[0]; // Get the user data (including role)
        const userRole = userToDelete.role;

        // --- Role-based Deletion Logic ---
        if (userRole === 'mentee') {
            // --- Call Stored Procedure for Mentee ---
            console.log(`User ${userId} is a mentee. Calling DeleteMenteeAndAllAssociations...`);
            const callQuery = 'CALL DeleteMenteeAndAllAssociations(?)';
            // Execute procedure within the transaction
            const [procResult] = await connection.query(callQuery, [userId]);
            console.log('DeleteMenteeAndAllAssociations procedure result:', procResult);
            // Assume success if no error is thrown by the procedure

        } else if (userRole === 'mentor') {
            // --- Manual Deletion Logic for Mentor ---
            console.log(`User ${userId} is a mentor. Deleting associated records...`);

            // 1. Get mentor_id (needed for some associations)
            const [mentorData] = await connection.query('SELECT mentor_id FROM mentor WHERE unique_user_no = ?', [userId]);
            const mentorId = mentorData.length > 0 ? mentorData[0].mentor_id : null;

            // 2. Delete achievements awarded by this mentor (if applicable)
            if (mentorId) {
                await connection.query('DELETE FROM achievement WHERE mentor_id = ?', [mentorId]);
                console.log(`Deleted achievements for mentor_id ${mentorId}`);
            }

            // 3. Delete mentor-mentee links
            if (mentorId) {
                // Assuming a table like 'mentor_mentee_link' exists
                // If not, adjust or remove this step. Let's assume it doesn't exist for now based on procedure.
                // await connection.query('DELETE FROM mentor_mentee_link WHERE mentor_id = ?', [mentorId]);
                // console.log(`Deleted links for mentor_id ${mentorId}`);
            }

            // 4. Delete related communications
            await connection.query('DELETE FROM communication WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
            console.log(`Deleted communications for user ${userId}`);

            // 5. Delete activity logs
            await connection.query('DELETE FROM activity_log WHERE user_id = ?', [userId]);
            console.log(`Deleted activity logs for user ${userId}`);

            // 6. Delete from mentor table
            await connection.query('DELETE FROM mentor WHERE unique_user_no = ?', [userId]);
            console.log(`Deleted mentor record for user ${userId}`);

            // 7. Delete from users table
            await connection.query('DELETE FROM users WHERE unique_user_no = ?', [userId]);
            console.log(`Deleted user record for mentor ${userId}`);

        } else if (userRole === 'admin') {
            // --- Manual Deletion Logic for Admin ---
            console.log(`User ${userId} is an admin. Deleting associated records...`);

            // 1. Delete related communications
            await connection.query('DELETE FROM communication WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
            console.log(`Deleted communications for user ${userId}`);

            // 2. Delete activity logs
            await connection.query('DELETE FROM activity_log WHERE user_id = ?', [userId]);
            console.log(`Deleted activity logs for user ${userId}`);

            // 3. Delete from admin table (if one exists and needs cleanup)
            // Assuming no separate 'admin' table needs specific cleanup based on procedure.
            // If there is an 'admin' table with unique_user_no, add:
            // await connection.query('DELETE FROM admin WHERE unique_user_no = ?', [userId]);
            // console.log(`Deleted admin record for user ${userId}`);

            // 4. Delete from users table
            await connection.query('DELETE FROM users WHERE unique_user_no = ?', [userId]);
            console.log(`Deleted user record for admin ${userId}`);

        } else {
            // Should not happen if role validation is correct, but good to handle
            await connection.rollback();
            console.log(`Unknown role '${userRole}' for user ${userId}. Transaction rolled back.`);
            return res.status(500).json({ message: `Unknown user role: ${userRole}` });
        }
        // --- End Role-based Deletion Logic ---

        // If all deletions were successful, commit the transaction
        await connection.commit();
        console.log(`Successfully deleted user ${userId} (role: ${userRole}). Transaction committed.`);
        return res.status(200).json({ message: `User (role: ${userRole}) deleted successfully` });

    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        // Rollback transaction on any error
        if (connection) {
            try {
                await connection.rollback();
                console.log(`Transaction rolled back due to error while deleting user ${userId}.`);
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        }

        // Check if the error is due to foreign key constraint (might indicate a missed dependency)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                message: 'Cannot delete this user due to remaining associated records (foreign key constraint). Check dependencies.',
                error: error.message
            });
        }

        res.status(500).json({ message: 'Error deleting user', error: error.message });
    } finally {
        // Always release the connection
        if (connection) {
            try {
                connection.release();
                console.log('Database connection released.');
            } catch (releaseError) {
                console.error('Error releasing connection:', releaseError);
            }
        }
    }
});

// PUT /api/users/:id - Update user by ID
router.put('/:id', async (req, res) => {
    let connection;
    try {
        // Get a connection from the pool
        connection = await db.getConnection();
        
        const userId = req.params.id;
        console.log(`PUT request to update user ${userId}`);
        
        // Validate user ID
        if (!userId || isNaN(parseInt(userId))) {
            console.log(`Invalid user ID format: ${userId}`);
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        // Extract user data from request body
        const { official_mail_id, password, phone_num, prn_id, role } = req.body;
        console.log('Update data:', { official_mail_id, phone_num, prn_id, role, hasPassword: !!password });
        
        // Begin transaction
        await connection.beginTransaction();
        
        // Check if user exists
        const [checkUser] = await connection.query('SELECT * FROM users WHERE unique_user_no = ?', [userId]);
        
        if (checkUser.length === 0) {
            console.log(`User ${userId} not found`);
            await connection.rollback();
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log(`Existing user data:`, checkUser[0]);
        
        // Check for unique constraint violations before updating
        if (official_mail_id && official_mail_id !== checkUser[0].official_mail_id) {
            const [emailCheck] = await connection.query(
                'SELECT unique_user_no FROM users WHERE official_mail_id = ? AND unique_user_no != ?', 
                [official_mail_id, userId]
            );
            
            if (emailCheck.length > 0) {
                console.log(`Email ${official_mail_id} already exists for user ${emailCheck[0].unique_user_no}`);
                await connection.rollback();
                return res.status(409).json({ message: 'Email already exists for another user' });
            }
        }
        
        if (prn_id && prn_id !== checkUser[0].prn_id) {
            const [prnCheck] = await connection.query(
                'SELECT unique_user_no FROM users WHERE prn_id = ? AND unique_user_no != ?', 
                [prn_id, userId]
            );
            
            if (prnCheck.length > 0) {
                console.log(`PRN ID ${prn_id} already exists for user ${prnCheck[0].unique_user_no}`);
                await connection.rollback();
                return res.status(409).json({ message: 'PRN ID already exists for another user' });
            }
        }
        
        // Build a new, completely explicit update query without any potential for transformation
        let updateSuccess = false;
        
        try {
            // Try a super-simple direct update bypassing any ORM-like functionality
            // We construct the query with only the specific columns we need to update
            let directQuery = 'UPDATE users SET ';
            const directValues = [];
            let hasUpdates = false;
            
            if (official_mail_id) {
                directQuery += 'official_mail_id = ?, ';
                directValues.push(official_mail_id);
                hasUpdates = true;
            }
            
            if (password) {
                directQuery += 'password = ?, ';
                directValues.push(password);
                hasUpdates = true;
            }
            
            if (phone_num !== undefined) {
                directQuery += 'phone_num = ?, ';
                directValues.push(phone_num === '' ? null : phone_num);
                hasUpdates = true;
            }
            
            if (prn_id) {
                directQuery += 'prn_id = ?, ';
                directValues.push(prn_id);
                hasUpdates = true;
            }
            
            if (role) {
                directQuery += 'role = ?, ';
                directValues.push(role);
                hasUpdates = true;
            }
            
            if (!hasUpdates) {
                console.log('No fields to update provided');
                await connection.rollback();
                return res.status(400).json({ message: 'No fields to update were provided' });
            }
            
            // Remove trailing comma and space
            directQuery = directQuery.slice(0, -2);
            
            // Add WHERE clause
            directQuery += ' WHERE unique_user_no = ?';
            directValues.push(userId);
            
            console.log('Direct update query:', directQuery);
            console.log('Direct update values:', directValues);
            
            const [directResult] = await connection.execute(directQuery, directValues);
            console.log('Direct update result:', directResult);
            
            if (directResult.affectedRows === 1) {
                updateSuccess = true;
            }
        } catch (directError) {
            console.error('Error in direct update approach:', directError);
            // Continue to next approach if this fails
        }
        
        if (!updateSuccess) {
            // If direct update failed, try individual column updates
            try {
                let individualUpdates = true;
                
                // Update each column individually to isolate issues
                if (official_mail_id) {
                    const [result1] = await connection.execute(
                        'UPDATE users SET official_mail_id = ? WHERE unique_user_no = ?',
                        [official_mail_id, userId]
                    );
                    console.log('Email update result:', result1);
                    individualUpdates = individualUpdates && (result1.affectedRows === 1);
                }
                
                if (password) {
                    const [result2] = await connection.execute(
                        'UPDATE users SET password = ? WHERE unique_user_no = ?',
                        [password, userId]
                    );
                    console.log('Password update result:', result2);
                    individualUpdates = individualUpdates && (result2.affectedRows === 1);
                }
                
                if (phone_num !== undefined) {
                    const phoneValue = phone_num === '' ? null : phone_num;
                    const [result3] = await connection.execute(
                        'UPDATE users SET phone_num = ? WHERE unique_user_no = ?',
                        [phoneValue, userId]
                    );
                    console.log('Phone update result:', result3);
                    individualUpdates = individualUpdates && (result3.affectedRows === 1);
                }
                
                if (prn_id) {
                    const [result4] = await connection.execute(
                        'UPDATE users SET prn_id = ? WHERE unique_user_no = ?',
                        [prn_id, userId]
                    );
                    console.log('PRN update result:', result4);
                    individualUpdates = individualUpdates && (result4.affectedRows === 1);
                }
                
                if (role) {
                    const [result5] = await connection.execute(
                        'UPDATE users SET role = ? WHERE unique_user_no = ?',
                        [role, userId]
                    );
                    console.log('Role update result:', result5);
                    individualUpdates = individualUpdates && (result5.affectedRows === 1);
                }
                
                updateSuccess = individualUpdates;
            } catch (individualError) {
                console.error('Error in individual updates approach:', individualError);
                // Continue to next approach if this fails
            }
        }
        
        if (updateSuccess) {
            // Commit the transaction
            await connection.commit();
            
            // Return the updated user
            const [updatedUser] = await connection.query('SELECT * FROM users WHERE unique_user_no = ?', [userId]);
            const userWithoutPassword = { ...updatedUser[0] };
            delete userWithoutPassword.password;
            
            console.log('User updated successfully');
            res.status(200).json(userWithoutPassword);
        } else {
            console.log('All update approaches failed');
            await connection.rollback();
            throw new Error('Failed to update user using multiple approaches');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        
        // Rollback the transaction if needed
        if (connection) {
            try {
                await connection.rollback();
                console.log('Transaction rolled back due to error');
            } catch (rollbackError) {
                console.error('Error rolling back transaction:', rollbackError);
            }
        }
        
        // Handle specific error cases
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('Duplicate entry error:', error.message);
            if (error.message.includes('official_mail_id')) {
                return res.status(409).json({ message: 'Email already exists' });
            }
            if (error.message.includes('prn_id')) {
                return res.status(409).json({ message: 'PRN ID already exists' });
            }
            if (error.message.includes('calendar_id')) {
                return res.status(409).json({ message: 'Calendar ID already exists' });
            }
            return res.status(409).json({ message: 'Duplicate entry error' });
        }
        
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_NO_REFERENCED_ROW_2') {
            console.log('Foreign key constraint error:', error.message);
            return res.status(409).json({ 
                message: 'Cannot update this user because it would violate database constraints',
                details: error.message
            });
        }
        
        res.status(500).json({ 
            message: 'Error updating user', 
            error: error.message,
            stack: error.stack
        });
    } finally {
        // Always release the connection
        if (connection) {
            try {
                connection.release();
                console.log('Database connection released');
            } catch (releaseError) {
                console.error('Error releasing connection:', releaseError);
            }
        }
    }
});

// PATCH /api/users/email/:id - Update only the email for a user
router.patch('/email/:id', async (req, res) => {
    let connection;
    try {
        const userId = req.params.id;
        const { email } = req.body;
        
        if (!userId || !email) {
            return res.status(400).json({ message: 'User ID and email are required' });
        }
        
        console.log(`PATCH request to update email for user ${userId} to ${email}`);
        
        // Get a direct connection to the database to bypass any pooling issues
        connection = await db.getConnection();
        
        // Disable triggers temporarily
        await connection.query('SET @TRIGGER_CHECKS = 0;');
        
        // Just a simple, direct SQL update without any abstractions
        const sql = `UPDATE users SET official_mail_id = ? WHERE unique_user_no = ?`;
        const [result] = await connection.execute(sql, [email, userId]);
        
        // Re-enable triggers
        await connection.query('SET @TRIGGER_CHECKS = 1;');
        
        console.log('Email update result:', result);
        
        if (result.affectedRows === 1) {
            return res.status(200).json({ 
                message: 'Email updated successfully',
                user_id: userId,
                email: email
            });
        } else {
            return res.status(404).json({ message: 'User not found or email not updated' });
        }
    } catch (error) {
        console.error('Error updating email:', error);
        return res.status(500).json({ 
            message: 'Error updating email', 
            error: error.message 
        });
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});

// PATCH /api/users/role/:id - Update only the role for a user
router.patch('/role/:id', async (req, res) => {
    let connection;
    try {
        const userId = req.params.id;
        const { role } = req.body;
        
        if (!userId || !role) {
            return res.status(400).json({ message: 'User ID and role are required' });
        }
        
        // Validate role
        if (!['admin', 'mentor', 'mentee'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be admin, mentor, or mentee' });
        }
        
        console.log(`PATCH request to update role for user ${userId} to ${role}`);
        
        // Get a direct connection to the database
        connection = await db.getConnection();
        
        // Disable triggers temporarily
        await connection.query('SET @TRIGGER_CHECKS = 0;');
        
        // Simple direct SQL update
        const sql = `UPDATE users SET role = ? WHERE unique_user_no = ?`;
        const [result] = await connection.execute(sql, [role, userId]);
        
        // Re-enable triggers
        await connection.query('SET @TRIGGER_CHECKS = 1;');
        
        console.log('Role update result:', result);
        
        if (result.affectedRows === 1) {
            return res.status(200).json({ 
                message: 'Role updated successfully',
                user_id: userId,
                role: role
            });
        } else {
            return res.status(404).json({ message: 'User not found or role not updated' });
        }
    } catch (error) {
        console.error('Error updating role:', error);
        return res.status(500).json({ 
            message: 'Error updating role', 
            error: error.message 
        });
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});

// PATCH /api/users/prn/:id - Update only the PRN ID for a user
router.patch('/prn/:id', async (req, res) => {
    let connection;
    try {
        const userId = req.params.id;
        const { prn_id } = req.body;
        
        if (!userId || !prn_id) {
            return res.status(400).json({ message: 'User ID and PRN ID are required' });
        }
        
        console.log(`PATCH request to update PRN ID for user ${userId} to ${prn_id}`);
        
        // Get a direct connection to the database
        connection = await db.getConnection();
        
        // Disable triggers temporarily
        await connection.query('SET @TRIGGER_CHECKS = 0;');
        
        // Check for duplicate PRN
        const [prnCheck] = await connection.execute(
            'SELECT unique_user_no FROM users WHERE prn_id = ? AND unique_user_no != ?',
            [prn_id, userId]
        );
        
        if (prnCheck.length > 0) {
            return res.status(409).json({ message: 'PRN ID already exists for another user' });
        }
        
        // Simple direct SQL update
        const sql = `UPDATE users SET prn_id = ? WHERE unique_user_no = ?`;
        const [result] = await connection.execute(sql, [prn_id, userId]);
        
        // Re-enable triggers
        await connection.query('SET @TRIGGER_CHECKS = 1;');
        
        console.log('PRN update result:', result);
        
        if (result.affectedRows === 1) {
            return res.status(200).json({ 
                message: 'PRN ID updated successfully',
                user_id: userId,
                prn_id: prn_id
            });
        } else {
            return res.status(404).json({ message: 'User not found or PRN ID not updated' });
        }
    } catch (error) {
        console.error('Error updating PRN ID:', error);
        return res.status(500).json({ 
            message: 'Error updating PRN ID', 
            error: error.message 
        });
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});

// PATCH /api/users/phone/:id - Update only the phone number for a user
router.patch('/phone/:id', async (req, res) => {
    let connection;
    try {
        const userId = req.params.id;
        const { phone_num } = req.body;
        
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }
        
        console.log(`PATCH request to update phone number for user ${userId} to ${phone_num}`);
        
        // Get a direct connection to the database
        connection = await db.getConnection();
        
        // Disable triggers temporarily
        await connection.query('SET @TRIGGER_CHECKS = 0;');
        
        // Simple direct SQL update
        const sql = `UPDATE users SET phone_num = ? WHERE unique_user_no = ?`;
        const [result] = await connection.execute(sql, [phone_num === '' ? null : phone_num, userId]);
        
        // Re-enable triggers
        await connection.query('SET @TRIGGER_CHECKS = 1;');
        
        console.log('Phone update result:', result);
        
        if (result.affectedRows === 1) {
            return res.status(200).json({ 
                message: 'Phone number updated successfully',
                user_id: userId,
                phone_num: phone_num === '' ? null : phone_num
            });
        } else {
            return res.status(404).json({ message: 'User not found or phone number not updated' });
        }
    } catch (error) {
        console.error('Error updating phone number:', error);
        return res.status(500).json({ 
            message: 'Error updating phone number', 
            error: error.message 
        });
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});

// --- Count Endpoints ---

// GET /api/users/count/total - Get total user count
router.get('/count/total', async (req, res) => {
    try {
        const [result] = await db.query('SELECT COUNT(*) as count FROM users');
        res.status(200).json(result[0]); // { count: N }
    } catch (error) {
        console.error('Error fetching total user count:', error);
        res.status(500).json({ message: 'Error fetching total user count' });
    }
});

// GET /api/users/count/mentors - Get mentor count
router.get('/count/mentors', async (req, res) => {
    try {
        const [result] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'mentor'");
        res.status(200).json(result[0]); // { count: N }
    } catch (error) {
        console.error('Error fetching mentor count:', error);
        res.status(500).json({ message: 'Error fetching mentor count' });
    }
});

// GET /api/users/count/mentees - Get mentee count
router.get('/count/mentees', async (req, res) => {
    try {
        const [result] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'mentee'");
        res.status(200).json(result[0]); // { count: N }
    } catch (error) {
        console.error('Error fetching mentee count:', error);
        res.status(500).json({ message: 'Error fetching mentee count' });
    }
});

// --- End Count Endpoints ---

// --- Login Endpoint ---
router.post('/login', async (req, res) => {
    try {
        const { official_mail_id, password } = req.body;

        if (!official_mail_id || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const query = 'SELECT unique_user_no, role, password FROM users WHERE official_mail_id = ?';
        const [users] = await db.query(query, [official_mail_id]);

        if (users.length === 0) {
            // User not found
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // --- Direct Password Comparison (INSECURE - Prototype Only!) ---
        if (password === user.password) {
            // Passwords match
            console.log(`User ${user.unique_user_no} (${official_mail_id}) logged in successfully.`);
            // Send back user ID and role (do not send password)
            res.status(200).json({
                message: 'Login successful',
                userId: user.unique_user_no,
                role: user.role
            });
        } else {
            // Passwords do not match
            console.log(`Login failed for ${official_mail_id}: Incorrect password.`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // --- End Insecure Comparison ---

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});
// --- End Login Endpoint ---


// GET /api/users/debug/triggers - Check and fix database triggers
router.get('/debug/triggers', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        
        // First, get all triggers on the users table
        const [triggers] = await connection.query(`
            SELECT TRIGGER_NAME, ACTION_STATEMENT, ACTION_TIMING, EVENT_MANIPULATION
            FROM information_schema.TRIGGERS
            WHERE EVENT_OBJECT_TABLE = 'users'
        `);
        
        console.log('Found triggers:', triggers);
        
        // Check each trigger for potential issues
        const problematicTriggers = triggers.filter(trigger => 
            trigger.ACTION_STATEMENT.toLowerCase().includes('users_id')
        );
        
        if (problematicTriggers.length > 0) {
            // Drop problematic triggers
            for (const trigger of problematicTriggers) {
                await connection.query(`DROP TRIGGER IF EXISTS ${trigger.TRIGGER_NAME}`);
                console.log(`Dropped trigger: ${trigger.TRIGGER_NAME}`);
            }
            
            // Recreate triggers with correct column name
            for (const trigger of problematicTriggers) {
                const newStatement = trigger.ACTION_STATEMENT.replace(/users_id/gi, 'unique_user_no');
                await connection.query(`
                    CREATE TRIGGER ${trigger.TRIGGER_NAME}
                    ${trigger.ACTION_TIMING} ${trigger.EVENT_MANIPULATION}
                    ON users FOR EACH ROW
                    ${newStatement}
                `);
                console.log(`Recreated trigger: ${trigger.TRIGGER_NAME}`);
            }
            
            res.status(200).json({
                message: 'Fixed problematic triggers',
                fixed_triggers: problematicTriggers.map(t => t.TRIGGER_NAME)
            });
        } else {
            // If no problematic triggers found, check for other potential issues
            const [tables] = await connection.query(`
                SELECT TABLE_NAME, COLUMN_NAME
                FROM information_schema.COLUMNS
                WHERE COLUMN_NAME LIKE '%user%id%'
                AND TABLE_SCHEMA = DATABASE()
            `);
            
            res.status(200).json({
                message: 'No problematic triggers found',
                related_columns: tables
            });
        }
    } catch (error) {
        console.error('Error checking triggers:', error);
        res.status(500).json({
            message: 'Error checking triggers',
            error: error.message
        });
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (err) {
                console.error('Error releasing connection:', err);
            }
        }
    }
});

// Add other user-specific routes here (e.g., GET /:id, POST /, PUT /:id, DELETE /:id) if needed

module.exports = router;
