-- DDL schema script for Objective 4 tables

-- 1. Create tenant_screening table
CREATE TABLE IF NOT EXISTS tenant_screening (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES tenant_applications(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    landlord_id UUID REFERENCES users(id) ON DELETE SET NULL,
    monthly_income DECIMAL(12, 2) NOT NULL CHECK (monthly_income >= 0),
    employment_status VARCHAR(50) NOT NULL CHECK (employment_status IN ('regular', 'contractual', 'self_employed', 'student', 'unemployed')),
    employment_details TEXT,
    payment_behavior_score INTEGER DEFAULT NULL CHECK (payment_behavior_score >= 0 AND payment_behavior_score <= 100),
    previous_rental_history VARCHAR(50) CHECK (previous_rental_history IN ('positive', 'neutral', 'negative')),
    rental_conduct_notes VARCHAR(50) CHECK (rental_conduct_notes IN ('positive', 'neutral', 'negative')),
    screening_score INTEGER CHECK (screening_score >= 0 AND screening_score <= 100),
    screening_result_label VARCHAR(50) CHECK (screening_result_label IN ('low_risk', 'moderate_risk', 'high_risk', 'insufficient_information')),
    screening_remarks TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create lease_records table
CREATE TABLE IF NOT EXISTS lease_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES tenant_applications(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL CHECK (lease_end_date > lease_start_date),
    monthly_rent DECIMAL(10, 2) NOT NULL CHECK (monthly_rent > 0),
    security_deposit DECIMAL(10, 2) NOT NULL CHECK (security_deposit >= 0),
    lease_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (lease_status IN ('active', 'ended', 'cancelled', 'terminated')),
    terms_and_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create utility_records table
CREATE TABLE IF NOT EXISTS utility_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES lease_records(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    utility_type VARCHAR(50) NOT NULL CHECK (utility_type IN ('electricity', 'water', 'internet', 'other')),
    billing_month VARCHAR(20) NOT NULL, -- e.g. "2026-05"
    previous_reading DECIMAL(10, 2) NOT NULL CHECK (previous_reading >= 0),
    current_reading DECIMAL(10, 2) NOT NULL CHECK (current_reading >= previous_reading),
    consumption DECIMAL(10, 2) NOT NULL CHECK (consumption >= 0),
    rate_per_unit DECIMAL(10, 2) NOT NULL CHECK (rate_per_unit >= 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create billing_records table
CREATE TABLE IF NOT EXISTS billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID NOT NULL REFERENCES lease_records(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    billing_month VARCHAR(20) NOT NULL, -- e.g. "2026-05"
    rent_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (rent_amount >= 0),
    utility_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (utility_amount >= 0),
    penalty_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (penalty_amount >= 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    due_date DATE NOT NULL,
    billing_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (billing_status IN ('unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create payment_records table
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_id UUID NOT NULL REFERENCES billing_records(id) ON DELETE RESTRICT,
    lease_id UUID NOT NULL REFERENCES lease_records(id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    payment_amount DECIMAL(10, 2) NOT NULL CHECK (payment_amount > 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('gcash', 'bank_transfer', 'cash', 'other')),
    payment_reference_number VARCHAR(100) NOT NULL,
    payment_proof_url TEXT NOT NULL,
    payment_proof_path TEXT NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending_verification' CHECK (payment_status IN ('pending_verification', 'verified', 'rejected')),
    verification_remarks TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
