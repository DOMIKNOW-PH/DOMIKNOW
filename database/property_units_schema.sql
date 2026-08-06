-- 0. Relax properties_monthly_rent_check and property_amenities_amenity_name_check constraints on Level 1 Property table
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_monthly_rent_check;
ALTER TABLE properties ADD CONSTRAINT properties_monthly_rent_check CHECK (monthly_rent >= 0);
ALTER TABLE property_amenities DROP CONSTRAINT IF EXISTS property_amenities_amenity_name_check;

-- 1. Create property_units table


CREATE TABLE IF NOT EXISTS property_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(100) NOT NULL,
    unit_type VARCHAR(50) NOT NULL DEFAULT 'room' CHECK (unit_type IN ('room', 'studio', '1_bedroom', '2_bedroom', 'bedspace', 'whole_house')),
    monthly_rent DECIMAL(10, 2) NOT NULL CHECK (monthly_rent > 0),
    security_deposit DECIMAL(10, 2) DEFAULT 0.00 CHECK (security_deposit >= 0),
    capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
    bedrooms INTEGER DEFAULT 1 CHECK (bedrooms >= 0),
    bathrooms INTEGER DEFAULT 1 CHECK (bathrooms >= 0),
    floor_area_sqm DECIMAL(6, 2) CHECK (floor_area_sqm >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'under_maintenance', 'unavailable')),
    main_image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create unit_amenities table
CREATE TABLE IF NOT EXISTS unit_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
    amenity_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create unit_images table
CREATE TABLE IF NOT EXISTS unit_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_path TEXT NOT NULL,
    is_main BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Add unit_id references to workflow tables
ALTER TABLE tenant_applications ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL;
ALTER TABLE property_reservations ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL;
ALTER TABLE billing_records ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL;
ALTER TABLE ratings_feedback ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES property_units(id) ON DELETE SET NULL;

-- 5. Seed default unit for existing properties that don't have units yet
DO $$
DECLARE
    prop RECORD;
    new_unit_id UUID;
BEGIN
    FOR prop IN SELECT * FROM properties LOOP
        IF NOT EXISTS (SELECT 1 FROM property_units WHERE property_id = prop.id) THEN
            INSERT INTO property_units (
                property_id,
                unit_number,
                unit_type,
                monthly_rent,
                security_deposit,
                capacity,
                bedrooms,
                bathrooms,
                floor_area_sqm,
                status,
                main_image_url,
                description
            ) VALUES (
                prop.id,
                'Unit 101',
                'room',
                prop.monthly_rent,
                prop.monthly_rent,
                prop.max_occupants,
                1,
                1,
                20.00,
                CASE WHEN prop.status = 'approved' THEN 'available' ELSE 'unavailable' END,
                prop.main_image_url,
                prop.description
            ) RETURNING id INTO new_unit_id;

            -- Copy property amenities as initial unit amenities for default unit
            INSERT INTO unit_amenities (unit_id, amenity_name)
            SELECT new_unit_id, amenity_name FROM property_amenities WHERE property_id = prop.id;

            -- Link existing applications, reservations, leases to this default unit
            UPDATE tenant_applications SET unit_id = new_unit_id WHERE property_id = prop.id AND unit_id IS NULL;
            UPDATE property_reservations SET unit_id = new_unit_id WHERE property_id = prop.id AND unit_id IS NULL;
            UPDATE lease_records SET unit_id = new_unit_id WHERE property_id = prop.id AND unit_id IS NULL;
            UPDATE billing_records SET unit_id = new_unit_id WHERE property_id = prop.id AND unit_id IS NULL;
            UPDATE maintenance_requests SET unit_id = new_unit_id WHERE property_id = prop.id AND unit_id IS NULL;
            UPDATE ratings_feedback SET unit_id = new_unit_id WHERE property_id = prop.id AND unit_id IS NULL;
        END IF;
    END LOOP;
END $$;
