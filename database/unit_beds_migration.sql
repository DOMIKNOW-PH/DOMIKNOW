-- ============================================================
-- MIGRATION: unit_beds — Refactor per-bed units into 1-to-many
-- Run this on Supabase SQL Editor
-- ============================================================

-- STEP 1: Add extra columns to property_units needed for the new model
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS floor TEXT;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS gender_restriction TEXT;
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS rental_style TEXT DEFAULT 'whole_room';
ALTER TABLE property_units ADD COLUMN IF NOT EXISTS room_name TEXT;

-- STEP 2: Create unit_beds table
CREATE TABLE IF NOT EXISTS unit_beds (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id      UUID NOT NULL REFERENCES property_units(id) ON DELETE CASCADE,
    bed_number   INTEGER NOT NULL,
    bed_label    TEXT,                        -- e.g. "Bed 1", "Bed 2"
    status       TEXT NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available', 'occupied', 'reserved', 'under_maintenance')),
    monthly_rent NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by unit
CREATE INDEX IF NOT EXISTS idx_unit_beds_unit_id ON unit_beds(unit_id);

-- STEP 3: Migrate existing per-bed property_units records
-- -------------------------------------------------------
-- For every group of records whose unit_number contains ' - Bed ',
-- we keep the one with the lowest created_at as the "canonical" room unit,
-- strip the ' - Bed N' suffix from its unit_number,
-- insert one unit_beds row per bed (including the canonical one),
-- reassign amenities and images to the canonical unit,
-- then delete the duplicate bed rows.

DO $$
DECLARE
    room_prefix     TEXT;
    canonical_id    UUID;
    bed_rec         RECORD;
    bed_num         INTEGER;
    existing_amenity TEXT;
BEGIN
    -- Iterate over every unique room prefix that has per-bed units
    FOR room_prefix IN
        SELECT DISTINCT split_part(unit_number, ' - Bed ', 1)
        FROM property_units
        WHERE unit_number LIKE '% - Bed %'
    LOOP
        -- Pick the canonical (first created) unit for this room prefix
        SELECT id INTO canonical_id
        FROM property_units
        WHERE unit_number LIKE room_prefix || ' - Bed %'
        ORDER BY created_at ASC
        LIMIT 1;

        -- Rename canonical unit: strip the ' - Bed N' suffix
        UPDATE property_units
        SET unit_number  = room_prefix,
            rental_style = 'per_bed',
            updated_at   = NOW()
        WHERE id = canonical_id;

        -- Insert one unit_beds row per bed in this group
        bed_num := 0;
        FOR bed_rec IN
            SELECT id, unit_number, status, monthly_rent
            FROM property_units
            WHERE unit_number LIKE room_prefix || ' - Bed %'
            ORDER BY created_at ASC
        LOOP
            bed_num := bed_num + 1;

            INSERT INTO unit_beds (unit_id, bed_number, bed_label, status, monthly_rent)
            VALUES (
                canonical_id,
                bed_num,
                'Bed ' || bed_num,
                bed_rec.status,
                bed_rec.monthly_rent
            );

            -- If this is NOT the canonical unit, migrate its amenities to canonical (no duplicates)
            IF bed_rec.id <> canonical_id THEN
                INSERT INTO unit_amenities (unit_id, amenity_name)
                SELECT canonical_id, a.amenity_name
                FROM unit_amenities a
                WHERE a.unit_id = bed_rec.id
                  AND NOT EXISTS (
                      SELECT 1 FROM unit_amenities x
                      WHERE x.unit_id = canonical_id
                        AND x.amenity_name = a.amenity_name
                  );

                -- Migrate images too (only if canonical has none yet)
                INSERT INTO unit_images (unit_id, image_url, image_path, is_main)
                SELECT canonical_id, image_url, image_path, is_main
                FROM unit_images
                WHERE unit_id = bed_rec.id
                  AND NOT EXISTS (SELECT 1 FROM unit_images WHERE unit_id = canonical_id);

                -- Re-point any FK references to the old bed unit → canonical unit
                UPDATE tenant_applications  SET unit_id = canonical_id WHERE unit_id = bed_rec.id;
                UPDATE property_reservations SET unit_id = canonical_id WHERE unit_id = bed_rec.id;
                UPDATE lease_records         SET unit_id = canonical_id WHERE unit_id = bed_rec.id;
                UPDATE billing_records       SET unit_id = canonical_id WHERE unit_id = bed_rec.id;
                UPDATE maintenance_requests  SET unit_id = canonical_id WHERE unit_id = bed_rec.id;
                UPDATE ratings_feedback      SET unit_id = canonical_id WHERE unit_id = bed_rec.id;

                -- Delete the old duplicate bed unit record
                DELETE FROM property_units WHERE id = bed_rec.id;
            END IF;
        END LOOP;

        -- Update canonical unit's capacity to match actual bed count
        UPDATE property_units
        SET capacity = (SELECT COUNT(*) FROM unit_beds WHERE unit_id = canonical_id)
        WHERE id = canonical_id;

    END LOOP;
END $$;
