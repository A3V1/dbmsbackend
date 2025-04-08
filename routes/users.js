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

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
    try {
        // Extract user data from request body
        const { official_mail_id, password, phone_num, prn_id, role, profile_picture, calendar_id } = req.body;
        
        // Validation
        if (!official_mail_id || !password || !prn_id || !role) {
            return res.status(400).json({ message: 'Required fields missing: email, password, PRN ID, and role are required' });
        }
        
        // Validate role is one of the allowed values
        if (!['admin', 'mentor', 'mentee'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be admin, mentor, or mentee' });
        }
        
        // Insert new user
        const query = `
            INSERT INTO users 
            (official_mail_id, password, phone_num, prn_id, role, profile_picture, calendar_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await db.query(query, [
            official_mail_id, 
            password, 
            phone_num || null, 
            prn_id, 
            role, 
            profile_picture || null, 
            calendar_id || `calendar${Date.now()}` // Generate a default calendar ID if not provided
        ]);
        
        if (result.affectedRows === 1) {
            // Return the newly created user
            const [newUser] = await db.query('SELECT * FROM users WHERE unique_user_no = ?', [result.insertId]);
            res.status(201).json(newUser[0]);
        } else {
            throw new Error('Failed to create user');
        }
        
    } catch (error) {
        console.error('Error creating user:', error);
        
        // Check for duplicate entry errors
        if (error.code === 'ER_DUP_ENTRY') {
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
        
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// DELETE /api/users/:id - Delete user by ID
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Validate user ID
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        // Check if user exists
        const [checkUser] = await db.query('SELECT unique_user_no FROM users WHERE unique_user_no = ?', [userId]);
        
        if (checkUser.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Delete the user
        const [result] = await db.query('DELETE FROM users WHERE unique_user_no = ?', [userId]);
        
        if (result.affectedRows === 1) {
            return res.status(200).json({ message: 'User deleted successfully' });
        } else {
            throw new Error('Failed to delete user');
        }
        
    } catch (error) {
        console.error('Error deleting user:', error);
        
        // Check if the error is due to foreign key constraint
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                message: 'Cannot delete this user because they have associated records. Remove those records first.' 
            });
        }
        
        res.status(500).json({ message: 'Error deleting user', error: error.message });
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
