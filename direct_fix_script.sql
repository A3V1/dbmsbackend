-- Check for any triggers that might be causing issues
SELECT * FROM information_schema.TRIGGERS 
WHERE EVENT_OBJECT_TABLE = 'users';

-- Check for any references to users_id in trigger definitions
SELECT * FROM information_schema.TRIGGERS 
WHERE ACTION_STATEMENT LIKE '%users_id%';

-- Check for references to users_id in views
SELECT TABLE_NAME, VIEW_DEFINITION 
FROM information_schema.VIEWS 
WHERE VIEW_DEFINITION LIKE '%users_id%';

-- Disable foreign key checks to allow structural changes
SET FOREIGN_KEY_CHECKS = 0;

-- Check if the activity_log table has a foreign key constraint that uses users_id
SELECT * FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME = 'users' 
AND TABLE_NAME = 'activity_log';

-- Update any references to users_id in activity_log table
-- This renames the column if it exists - uncomment if needed
-- ALTER TABLE activity_log CHANGE COLUMN users_id user_id INT NOT NULL;

-- Fix any foreign key constraints pointing to users_id
-- Uncomment and adjust table names and constraint names as needed
/*
ALTER TABLE activity_log 
DROP FOREIGN KEY fk_activity_log_users;

ALTER TABLE activity_log
ADD CONSTRAINT fk_activity_log_users
FOREIGN KEY (user_id) REFERENCES users(unique_user_no);
*/

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create proper views with correct column names
-- Example (uncomment and adjust as needed):
/*
DROP VIEW IF EXISTS some_view_name;
CREATE VIEW some_view_name AS 
SELECT u.unique_user_no AS user_id, u.official_mail_id 
FROM users u;
*/ 