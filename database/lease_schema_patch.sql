-- Schema migration patch for Lease Module

-- 1. Alter check constraint for lease_status in lease_records table
ALTER TABLE lease_records DROP CONSTRAINT IF EXISTS lease_records_lease_status_check;
ALTER TABLE lease_records ADD CONSTRAINT lease_records_lease_status_check 
    CHECK (lease_status IN ('pending_tenant_acceptance', 'accepted', 'rejected', 'active', 'expired', 'terminated', 'ended', 'cancelled'));

-- Set default status to pending_tenant_acceptance
ALTER TABLE lease_records ALTER COLUMN lease_status SET DEFAULT 'pending_tenant_acceptance';

-- 2. Add columns to lease_records table
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS lease_number VARCHAR(100);
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS advance_payment DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS payment_due_day INTEGER;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS utilities_covered JSONB DEFAULT '[]'::jsonb;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS utilities_other TEXT;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS max_occupants INTEGER DEFAULT 1;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS pet_policy VARCHAR(50) DEFAULT 'Not Allowed';
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS pet_conditions TEXT;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS smoking_policy VARCHAR(50) DEFAULT 'Not Allowed';
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS parking_policy VARCHAR(50) DEFAULT 'Not Included';
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS parking_slot_number TEXT;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS house_rules TEXT;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS landlord_responsibilities TEXT;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS tenant_responsibilities TEXT;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS late_fee_amount VARCHAR(50);
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS grace_period INTEGER DEFAULT 0;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS termination_policy TEXT;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS additional_terms TEXT;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS landlord_signature_name VARCHAR(255);
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS landlord_signature_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS tenant_signature_name VARCHAR(255);
ALTER TABLE lease_records ADD COLUMN IF NOT EXISTS tenant_signature_date TIMESTAMP WITH TIME ZONE;

-- 3. Add unit_number to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS unit_number VARCHAR(50);
