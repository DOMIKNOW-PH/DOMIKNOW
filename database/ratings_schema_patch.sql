-- Ratings & Feedback Module Database Schema Patch
-- One overall rating per lease contract, linked to landlord & property

-- 1. Create landlord_ratings table
CREATE TABLE IF NOT EXISTS landlord_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES lease_records(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT one_rating_per_lease UNIQUE (tenant_id, lease_id)
);

-- 2. Create index for fast landlord and property lookups
CREATE INDEX IF NOT EXISTS idx_landlord_ratings_landlord_id ON landlord_ratings(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_ratings_property_id ON landlord_ratings(property_id);
CREATE INDEX IF NOT EXISTS idx_landlord_ratings_tenant_id ON landlord_ratings(tenant_id);

-- 3. Add average_rating and rating_count columns to properties table (if not exists)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0.00;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 4. RLS: Enable row level security (optional, if using Supabase RLS)
-- ALTER TABLE landlord_ratings ENABLE ROW LEVEL SECURITY;
