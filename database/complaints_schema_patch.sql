-- Complaint Module Database Schema Patch
-- Formal complaint submission and management workflow

-- 1. Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number VARCHAR(30) UNIQUE NOT NULL,
    lease_id UUID NOT NULL REFERENCES lease_records(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'billing_concern', 'landlord_concern', 'safety_concern',
        'policy_violation', 'utility_concern', 'noise_complaint', 'other'
    )),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    attachment_url TEXT,
    attachment_path TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'under_review', 'in_progress', 'resolved', 'closed', 'rejected'
    )),
    resolution_notes TEXT,
    rejection_reason TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create complaint_status_logs table
CREATE TABLE IF NOT EXISTS complaint_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    remarks TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_tenant_id ON complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_landlord_id ON complaints(landlord_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaint_logs_complaint_id ON complaint_status_logs(complaint_id);

-- 4. Create sequence for complaint_number
CREATE SEQUENCE IF NOT EXISTS complaint_number_seq START WITH 1 INCREMENT BY 1;
