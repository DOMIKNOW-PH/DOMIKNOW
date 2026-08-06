-- DDL Schema Patch for Billing & Payment Module Enhancements

-- 1. Add detailed monthly utility breakdown columns to billing_records
ALTER TABLE billing_records 
ADD COLUMN IF NOT EXISTS water DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (water >= 0),
ADD COLUMN IF NOT EXISTS electricity DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (electricity >= 0),
ADD COLUMN IF NOT EXISTS internet DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (internet >= 0),
ADD COLUMN IF NOT EXISTS parking DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (parking >= 0),
ADD COLUMN IF NOT EXISTS other_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (other_charges >= 0),
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 2. Drop old check constraint on billing_status to allow new status flow
ALTER TABLE billing_records DROP CONSTRAINT IF EXISTS billing_records_billing_status_check;

-- 3. Relax billing_status check constraint to support the complete flow
ALTER TABLE billing_records ADD CONSTRAINT billing_records_billing_status_check 
CHECK (billing_status IN ('draft', 'pending_payment', 'waiting_verification', 'paid', 'overdue', 'cancelled', 'unpaid', 'partially_paid'));

-- 4. Alter billing_status DEFAULT value to 'pending_payment'
ALTER TABLE billing_records ALTER COLUMN billing_status SET DEFAULT 'pending_payment';

-- 5a. Deduplicate billing_records — keep only the LATEST record per (lease_id, billing_month)
--     This removes older duplicate rows that would block the unique constraint below.
DELETE FROM billing_records
WHERE id IN (
    SELECT id FROM (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY lease_id, billing_month
                ORDER BY created_at DESC, id DESC
            ) AS rn
        FROM billing_records
    ) ranked
    WHERE rn > 1
);

-- 5b. Add unique constraint to prevent future duplicate billing records
ALTER TABLE billing_records DROP CONSTRAINT IF EXISTS unique_lease_month;
ALTER TABLE billing_records ADD CONSTRAINT unique_lease_month UNIQUE (lease_id, billing_month);

-- 6. Relax check constraint for payment_status in payment_records
ALTER TABLE payment_records DROP CONSTRAINT IF EXISTS payment_records_payment_status_check;
ALTER TABLE payment_records ADD CONSTRAINT payment_records_payment_status_check 
CHECK (payment_status IN ('pending_verification', 'paid', 'verified', 'rejected'));
