-- Ratings & Feedback Module Refactored Database Schema Patch

-- 1. Create property_ratings table (Module A)
CREATE TABLE IF NOT EXISTS property_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES lease_records(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    cleanliness INTEGER NOT NULL CHECK (cleanliness >= 1 AND cleanliness <= 5),
    safety INTEGER NOT NULL CHECK (safety >= 1 AND safety <= 5),
    comfort INTEGER NOT NULL CHECK (comfort >= 1 AND comfort <= 5),
    amenities INTEGER NOT NULL CHECK (amenities >= 1 AND amenities <= 5),
    location INTEGER NOT NULL CHECK (location >= 1 AND location <= 5),
    internet_availability INTEGER NOT NULL CHECK (internet_availability >= 1 AND internet_availability <= 5),
    water_supply INTEGER NOT NULL CHECK (water_supply >= 1 AND water_supply <= 5),
    electricity_reliability INTEGER NOT NULL CHECK (electricity_reliability >= 1 AND electricity_reliability <= 5),
    noise_level INTEGER NOT NULL CHECK (noise_level >= 1 AND noise_level <= 5),
    overall_satisfaction INTEGER NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
    overall_computed_avg DECIMAL(3, 2) NOT NULL,
    feedback TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT one_property_rating_per_lease UNIQUE (tenant_id, lease_id)
);

-- 2. Create landlord_ratings_v2 table (Module B)
CREATE TABLE IF NOT EXISTS landlord_ratings_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES lease_records(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    communication INTEGER NOT NULL CHECK (communication >= 1 AND communication <= 5),
    responsiveness INTEGER NOT NULL CHECK (responsiveness >= 1 AND responsiveness <= 5),
    professionalism INTEGER NOT NULL CHECK (professionalism >= 1 AND professionalism <= 5),
    fairness INTEGER NOT NULL CHECK (fairness >= 1 AND fairness <= 5),
    maintenance_response INTEGER NOT NULL CHECK (maintenance_response >= 1 AND maintenance_response <= 5),
    respectfulness INTEGER NOT NULL CHECK (respectfulness >= 1 AND respectfulness <= 5),
    reliability INTEGER NOT NULL CHECK (reliability >= 1 AND reliability <= 5),
    overall_satisfaction INTEGER NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
    overall_computed_avg DECIMAL(3, 2) NOT NULL,
    feedback TEXT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT one_landlord_rating_per_lease UNIQUE (tenant_id, lease_id)
);

-- 3. Add columns to users table for landlord rating
ALTER TABLE users ADD COLUMN IF NOT EXISTS landlord_average_rating DECIMAL(3, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS landlord_rating_count INTEGER DEFAULT 0;

-- 4. Add average_rating and rating_count columns to properties table (in case they don't exist, though they should)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0.00;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 5. Create indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_property_ratings_property_id ON property_ratings(property_id);
CREATE INDEX IF NOT EXISTS idx_property_ratings_tenant_id ON property_ratings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_ratings_landlord_id ON property_ratings(landlord_id);

CREATE INDEX IF NOT EXISTS idx_landlord_ratings_v2_landlord_id ON landlord_ratings_v2(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_ratings_v2_tenant_id ON landlord_ratings_v2(tenant_id);
