-- ALTER TABLE statements to add bed_id references to workflow tables
ALTER TABLE tenant_applications ADD COLUMN IF NOT EXISTS bed_id UUID REFERENCES unit_beds(id) ON DELETE SET NULL;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS bed_id UUID REFERENCES unit_beds(id) ON DELETE SET NULL;
ALTER TABLE property_reservations ADD COLUMN IF NOT EXISTS bed_id UUID REFERENCES unit_beds(id) ON DELETE SET NULL;
