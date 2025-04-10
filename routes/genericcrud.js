// routes/genericCrud.js
const express = require('express');
const pool = require('../dbConfig'); // Adjust path ../ if needed

// Use { mergeParams: true } to access :tableName from parent route
const router = express.Router({ mergeParams: true });

// Helper Function: Determines the primary key field for a given table.
function getPrimaryKeyField(tableName) {
    // Add more cases as needed based on your database schema
    switch (tableName) {
        case 'mentor':
            return 'mentor_id';
        case 'mentee':
            return 'mentee_id';
        case 'mentee_academics': // Note: mentee_id is PK here, but it's also a FK. Check if this is intended.
             return 'mentee_id';
        case 'admin':
            return 'admin_id';
        case 'communication':
            return 'comm_id';
        case 'emergency_alerts':
            return 'emergency_alert_id';
        case 'activity_log':
            return 'log_id';
        case 'achievement':
            return 'achvmt_id';
        case 'users':
             return 'unique_user_no'; // Based on describe users output
        // Add cases for other tables like achievement, activity_log, etc.
        default:
            console.warn(`Primary key for table '${tableName}' not explicitly defined. Assuming 'id'. Modify getPrimaryKeyField if this is incorrect.`);
            return 'id'; // Default assumption
    }
}

// GET /api/:tableName - Get all items
router.get('/', async (req, res) => {
    const { tableName } = req.params;
    try {
        const sql = 'SELECT * FROM ??'; // ?? is for table/column names
        const [rows] = await pool.query(sql, [tableName]);
        res.json(rows);
    } catch (error) {
        console.error(`Error fetching all from ${tableName}:`, error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({ message: `Table '${tableName}' not found.` });
       }
        res.status(500).json({ message: `Error fetching data from table ${tableName}` });
    }
});

// GET /api/:tableName/:id - Get single item by ID
router.get('/:id', async (req, res) => {
    const { tableName, id } = req.params;
    const primaryKeyField = getPrimaryKeyField(tableName);
    try {
        const sql = `SELECT * FROM ?? WHERE ?? = ?`; // ? is for values
        const [rows] = await pool.query(sql, [tableName, primaryKeyField, id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: `Item with ID ${id} not found in table ${tableName}` });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(`Error fetching ID ${id} from ${tableName}:`, error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({ message: `Table '${tableName}' not found.` });
       }
        res.status(500).json({ message: `Error fetching data from table ${tableName}` });
    }
});

// POST /api/:tableName - Create new item
router.post('/', async (req, res) => {
    const { tableName } = req.params;
    console.log(`--- Generic CRUD: POST /api/${tableName} received ---`); // Added log
    const dataToInsert = req.body; // Assumes body contains column:value pairs
// Input validation for mentee creation
const requiredFields = ['unique_user_no', 'mentor_id'];
const missingFields = requiredFields.filter(field => !(field in dataToInsert));
if (missingFields.length > 0) {
    return res.status(400).json({ message: `Missing required fields for mentee creation: ${missingFields.join(', ')}` });
}
//Further validation can be added here to check data types, etc.
if (!dataToInsert || Object.keys(dataToInsert).length === 0) {
         return res.status(400).json({ message: 'Request body cannot be empty.' });
    }
    try {
        const sql = 'INSERT INTO ?? SET ?';
        const [result] = await pool.query(sql, [tableName, dataToInsert]);
        res.status(201).json({ message: `Item created in ${tableName}`, insertId: result.insertId });
    } catch (error) {
        console.error(`Error creating item in ${tableName}:`, error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({ message: `Table '${tableName}' not found.` });
       }
       if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(400).json({ message: `Invalid column name provided for table '${tableName}'.`, detail: error.sqlMessage });
        }
        // Log more specific errors
        console.error(`Detailed error creating item in ${tableName}:`, error.code, error.sqlMessage, error.sql);
        // Handle specific common errors
        if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ message: `Duplicate entry. This item might already exist.`, detail: error.sqlMessage });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
             return res.status(400).json({ message: `Invalid reference. Ensure the provided user number and mentor ID exist.`, detail: error.sqlMessage });
        }
        // Generic error
        res.status(500).json({ message: `Error saving data to table ${tableName}`, code: error.code, detail: error.sqlMessage });
    }
});

// PUT /api/:tableName/:id - Update existing item by ID
router.put('/:id', async (req, res) => {
    const { tableName, id } = req.params;
    const dataToUpdate = req.body;
    const primaryKeyField = getPrimaryKeyField(tableName);
    // **ACTION REQUIRED**: Add input validation here!
     if (!dataToUpdate || Object.keys(dataToUpdate).length === 0) {
         return res.status(400).json({ message: 'Request body cannot be empty for update.' });
    }
    // Optional: Prevent primary key updates via PUT
    // delete dataToUpdate[primaryKeyField];
    try {
        const sql = 'UPDATE ?? SET ? WHERE ?? = ?';
        const [result] = await pool.query(sql, [tableName, dataToUpdate, primaryKeyField, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Item with ID ${id} not found in table ${tableName} for update.` });
        }
        res.json({ message: `Item ${id} updated successfully in ${tableName}. Changed rows: ${result.changedRows}` });
    } catch (error) {
        console.error(`Error updating ID ${id} in ${tableName}:`, error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({ message: `Table '${tableName}' not found.` });
       }
       if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(400).json({ message: `Invalid column name provided for update in table '${tableName}'.`, detail: error.sqlMessage });
        }
        res.status(500).json({ message: `Error updating data in table ${tableName}`, code: error.code });
    }
});

// DELETE /api/:tableName/:id - Delete item by ID
router.delete('/:id', async (req, res) => {
    const { tableName, id } = req.params;
    console.log(`--- Generic CRUD: DELETE /api/${tableName}/${id} received ---`); // Added log
    const primaryKeyField = getPrimaryKeyField(tableName);
    try {
        const sql = 'DELETE FROM ?? WHERE ?? = ?';
        const [result] = await pool.query(sql, [tableName, primaryKeyField, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Item with ID ${id} not found in table ${tableName} for deletion.` });
        }
        res.status(200).json({ message: `Item ${id} deleted successfully from ${tableName}.` });
        // Or res.status(204).send(); for no content response
    } catch (error) {
        console.error(`Error deleting ID ${id} from ${tableName}:`, error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(404).json({ message: `Table '${tableName}' not found.` });
       }
        // Handle foreign key constraint errors etc.
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: `Cannot delete item ${id} from ${tableName} as it is referenced by another table.`, detail: error.sqlMessage });
        }
        res.status(500).json({ message: `Error deleting data from table ${tableName}`, code: error.code });
    }
});

module.exports = router;
