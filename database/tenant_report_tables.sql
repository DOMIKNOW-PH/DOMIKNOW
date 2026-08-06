-- ============================================================
-- DDL Script: Report Tenant Module Tables
-- Created for DOMIKNOW 2026 – Objective 6
-- ============================================================

-- 1. Create tenant_reports table
--    Dedicated table for landlord-filed reports against tenants.
--    Separate from user_reports (general) and policy_violations.
CREATE TABLE IF NOT EXISTS tenant_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parties
    landlord_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lease_id    UUID NOT NULL REFERENCES lease_records(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Incident Information
    report_category VARCHAR(50) NOT NULL CHECK (report_category IN (
        'non_payment',
        'property_damage',
        'house_rule_violation',
        'noise_complaint',
        'illegal_activity',
        'unauthorized_occupants',
        'harassment',
        'unsanitary_behavior',
        'utility_abuse',
        'other'
    )),
    incident_date        DATE NOT NULL,
    incident_description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),

    -- Admin Decision
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

    -- Tenant Response
    tenant_explanation   TEXT,
    tenant_responded_at  TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create tenant_report_evidence table
--    Multiple evidence files per report (photos, PDFs, videos, etc.)
CREATE TABLE IF NOT EXISTS tenant_report_evidence (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES tenant_reports(id) ON DELETE CASCADE,

    file_name  VARCHAR(255) NOT NULL,
    file_url   TEXT         NOT NULL,
    file_path  TEXT         NOT NULL,
    file_type  VARCHAR(100) NOT NULL,  -- MIME type (e.g. image/jpeg, video/mp4)
    file_size  BIGINT,                 -- size in bytes

    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_reports_landlord_id  ON tenant_reports(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reports_tenant_id    ON tenant_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reports_lease_id     ON tenant_reports(lease_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reports_status       ON tenant_reports(status);
CREATE INDEX IF NOT EXISTS idx_tenant_report_evidence_report ON tenant_report_evidence(report_id);
