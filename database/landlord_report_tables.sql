-- =============================================================================
-- Report Landlord Module Schema (Tenant -> Landlord Reports)
-- =============================================================================

-- 1. Create landlord_reports table
CREATE TABLE IF NOT EXISTS landlord_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    landlord_id  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    lease_id     UUID NOT NULL REFERENCES lease_records(id) ON DELETE RESTRICT,
    property_id  UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,

    -- Incident Information
    report_category VARCHAR(50) NOT NULL CHECK (
        report_category IN (
            'maintenance_neglect',
            'illegal_eviction',
            'deposit_withholding',
            'harassment',
            'lease_violation',
            'unauthorized_entry',
            'overcharging',
            'discrimination',
            'threats_abuse',
            'other'
        )
    ),
    incident_date        DATE NOT NULL,
    incident_description TEXT NOT NULL,
    severity             VARCHAR(20) NOT NULL CHECK (
        severity IN ('minor', 'moderate', 'major', 'critical')
    ),

    -- Admin Review & Decision Flow
    status VARCHAR(30) NOT NULL DEFAULT 'pending_admin_review'
        CHECK (status IN (
            'pending_admin_review',
            'approved',
            'rejected',
            'needs_more_evidence'
        )),
    admin_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_remarks TEXT,
    reviewed_at   TIMESTAMP WITH TIME ZONE,

    -- Landlord Response / Explanation
    landlord_explanation   TEXT,
    landlord_responded_at  TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create landlord_report_evidence table
CREATE TABLE IF NOT EXISTS landlord_report_evidence (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES landlord_reports(id) ON DELETE CASCADE,

    file_name  VARCHAR(255) NOT NULL,
    file_url   TEXT         NOT NULL,
    file_path  TEXT         NOT NULL,
    file_type  VARCHAR(100) NOT NULL,
    file_size  BIGINT,

    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add landlord_trust_score column to users table (default 100)
ALTER TABLE users ADD COLUMN IF NOT EXISTS landlord_trust_score INTEGER DEFAULT 100 CHECK (landlord_trust_score >= 0 AND landlord_trust_score <= 100);

-- Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_landlord_reports_tenant_id   ON landlord_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_landlord_reports_landlord_id ON landlord_reports(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_reports_status      ON landlord_reports(status);
CREATE INDEX IF NOT EXISTS idx_landlord_report_ev_report_id ON landlord_report_evidence(report_id);
