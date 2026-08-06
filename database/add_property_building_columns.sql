-- Add building specs columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors INTEGER DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_capacity INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS landmark TEXT;
