-- Migration: Add auditor_names column to audits table
-- This enables storing multiple auditors per audit

-- Add the new column if it doesn't exist
ALTER TABLE audits 
ADD COLUMN IF NOT EXISTS auditor_names TEXT[] DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN audits.auditor_names IS 'Array of auditor names - supports multiple auditors per audit';

-- Migrate existing single auditor_name values to the new array column
-- This preserves backward compatibility
UPDATE audits 
SET auditor_names = ARRAY[auditor_name]
WHERE auditor_name IS NOT NULL 
  AND auditor_name != ''
  AND (auditor_names IS NULL OR array_length(auditor_names, 1) IS NULL);
