-- Migration: Add photo_urls column to audit_responses table
-- This enables storing multiple photos per audit item

-- Add the new column if it doesn't exist
ALTER TABLE audit_responses 
ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN audit_responses.photo_urls IS 'Array of photo URLs - supports multiple photos per audit item';

-- Migrate existing single photo_url values to the new array column
-- This preserves backward compatibility
UPDATE audit_responses 
SET photo_urls = ARRAY[photo_url]
WHERE photo_url IS NOT NULL 
  AND (photo_urls IS NULL OR array_length(photo_urls, 1) IS NULL);
