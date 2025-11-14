-- Add exam_date column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS exam_date DATE;

-- Add comment to explain the column
COMMENT ON COLUMN users.exam_date IS 'User''s EPPP exam date';
