-- Check for triggers on the users table
SELECT TRIGGER_NAME, ACTION_STATEMENT, ACTION_TIMING, EVENT_MANIPULATION 
FROM information_schema.TRIGGERS 
WHERE EVENT_OBJECT_TABLE = 'users';

-- Look for triggers that might be referencing users_id
SELECT TRIGGER_NAME, ACTION_STATEMENT 
FROM information_schema.TRIGGERS 
WHERE EVENT_OBJECT_TABLE = 'users' 
AND ACTION_STATEMENT LIKE '%users_id%';

-- Example of how to drop a problematic trigger (replace TRIGGER_NAME with actual name)
-- DROP TRIGGER IF EXISTS TRIGGER_NAME;

-- After reviewing, you can drop all problematic triggers and recreate them with the correct column name
-- The following are some example statements - modify as needed after identifying the actual triggers:

-- Example fix for insert trigger:
-- CREATE TRIGGER after_user_insert AFTER INSERT ON users
-- FOR EACH ROW
-- BEGIN
--   INSERT INTO some_table (user_id, action) VALUES (NEW.unique_user_no, 'created');
-- END;

-- Example fix for update trigger:
-- CREATE TRIGGER after_user_update AFTER UPDATE ON users
-- FOR EACH ROW
-- BEGIN
--   INSERT INTO some_table (user_id, action) VALUES (NEW.unique_user_no, 'updated');
-- END;

-- Example fix for delete trigger:
-- CREATE TRIGGER before_user_delete BEFORE DELETE ON users
-- FOR EACH ROW
-- BEGIN
--   DELETE FROM some_table WHERE user_id = OLD.unique_user_no;
-- END; 