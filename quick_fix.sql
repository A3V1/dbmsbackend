-- Quick fix approach: Add a users_id column to the users table that mirrors unique_user_no
-- This will make any triggers or views that look for users_id work correctly

-- 1. First, add the column to the users table
ALTER TABLE users ADD COLUMN users_id INT GENERATED ALWAYS AS (unique_user_no) STORED;

-- 2. Check if it worked
SELECT unique_user_no, users_id FROM users LIMIT 5;

-- If you need to remove this later after fixing all triggers/views:
-- ALTER TABLE users DROP COLUMN users_id; 