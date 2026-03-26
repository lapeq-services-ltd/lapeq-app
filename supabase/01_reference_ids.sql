-- Add human-readable reference IDs to requests
-- Run this in Supabase SQL Editor

ALTER TABLE requests ADD COLUMN IF NOT EXISTS reference TEXT UNIQUE;

-- Create a sequence for the reference number
CREATE SEQUENCE IF NOT EXISTS request_reference_seq START 1;

-- Function to generate LPQ-XXXXX reference
CREATE OR REPLACE FUNCTION generate_request_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference IS NULL THEN
        NEW.reference := 'LPQ-' || LPAD(nextval('request_reference_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign reference on insert
DROP TRIGGER IF EXISTS set_request_reference ON requests;
CREATE TRIGGER set_request_reference
    BEFORE INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION generate_request_reference();

-- Backfill existing requests that have no reference
UPDATE requests
SET reference = 'LPQ-' || LPAD(rownum::TEXT, 5, '0')
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rownum
    FROM requests
    WHERE reference IS NULL
) AS numbered
WHERE requests.id = numbered.id;
