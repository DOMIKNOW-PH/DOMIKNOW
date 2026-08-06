const supabase = require('../config/supabaseClient');

const SEVERITY_TRUST_DEDUCTIONS = {
    minor: 2,
    moderate: 5,
    major: 10,
    critical: 20
};

const landlordReportModel = {

    // ─── Relationship Validation ──────────────────────────────────────────────

    /**
     * Get lease summary to verify that tenant has a lease with landlord.
     */
    async getTenantLeaseSummary(leaseId, tenantId) {
        const { data, error } = await supabase
            .from('lease_records')
            .select(`
                id,
                lease_number,
                landlord_id,
                tenant_id,
                property_id,
                lease_status,
                properties ( property_name, address, unit_number ),
                landlord:users!lease_records_landlord_id_fkey ( id, full_name, email, landlord_trust_score )
            `)
            .eq('id', leaseId)
            .eq('tenant_id', tenantId)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    // ─── Create ───────────────────────────────────────────────────────────────

    async createLandlordReport(reportData) {
        const { data, error } = await supabase
            .from('landlord_reports')
            .insert([{
                ...reportData,
                status: 'pending_admin_review'
            }])
            .select('id, tenant_id, landlord_id, lease_id, property_id, report_category, incident_date, incident_description, severity, status, created_at')
            .single();

        if (error) throw error;
        return data;
    },

    async addEvidence(reportId, files) {
        const rows = files.map(f => ({
            report_id: reportId,
            file_name: f.file_name,
            file_url:  f.file_url,
            file_path: f.file_path,
            file_type: f.file_type,
            file_size: f.file_size || null
        }));

        const { data, error } = await supabase
            .from('landlord_report_evidence')
            .insert(rows)
            .select();

        if (error) throw error;
        return data;
    },

    // ─── Read – Tenant ────────────────────────────────────────────────────────

    async findReportsByTenantId(tenantId) {
        const { data, error } = await supabase
            .from('landlord_reports')
            .select(`
                id, report_category, incident_date, severity, status,
                admin_remarks, created_at, updated_at,
                landlord:users!landlord_reports_landlord_id_fkey ( id, full_name, email ),
                properties ( property_name, unit_number, address ),
                lease_records ( lease_number, property_units ( unit_number ) )
            `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // ─── Read – Landlord ──────────────────────────────────────────────────────

    async findReportsByLandlordId(landlordId) {
        const { data, error } = await supabase
            .from('landlord_reports')
            .select(`
                id, report_category, incident_date, severity, status,
                incident_description, admin_remarks,
                landlord_explanation, landlord_responded_at,
                created_at, reviewed_at,
                tenant:users!landlord_reports_tenant_id_fkey ( full_name ),
                properties ( property_name, unit_number )
            `)
            .eq('landlord_id', landlordId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    // ─── Read – Admin ─────────────────────────────────────────────────────────

    async findAllLandlordReports() {
        const { data, error } = await supabase
            .from('landlord_reports')
            .select(`
                id, report_category, incident_date, severity, status,
                admin_remarks, created_at, updated_at, reviewed_at,
                tenant:users!landlord_reports_tenant_id_fkey ( id, full_name, email ),
                landlord:users!landlord_reports_landlord_id_fkey ( id, full_name, email, landlord_trust_score ),
                properties ( property_name, unit_number, address )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async findLandlordReportById(id) {
        const { data, error } = await supabase
            .from('landlord_reports')
            .select(`
                *,
                tenant:users!landlord_reports_tenant_id_fkey ( id, full_name, email, contact_number ),
                landlord:users!landlord_reports_landlord_id_fkey ( id, full_name, email, contact_number, landlord_trust_score ),
                properties ( id, property_name, address, unit_number ),
                lease_records ( id, lease_number, lease_status, lease_start_date, lease_end_date, monthly_rent, property_units ( unit_number, rental_style ) )
            `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    async findEvidenceByReportId(reportId) {
        const { data, error } = await supabase
            .from('landlord_report_evidence')
            .select('*')
            .eq('report_id', reportId)
            .order('uploaded_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getPreviousReportsAgainstLandlord(landlordId, excludeReportId) {
        let query = supabase
            .from('landlord_reports')
            .select(`
                id, report_category, severity, status, incident_date, created_at,
                tenant:users!landlord_reports_tenant_id_fkey ( full_name )
            `)
            .eq('landlord_id', landlordId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (excludeReportId) {
            query = query.neq('id', excludeReportId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    // ─── Update – Admin Decision & Trust Score ─────────────────────────────────

    async updateLandlordReportStatus(id, { status, severity, admin_remarks, admin_id }) {
        // Fetch report first to get landlord_id and severity
        const { data: report, error: fetchErr } = await supabase
            .from('landlord_reports')
            .select('id, landlord_id, severity, status')
            .eq('id', id)
            .single();

        if (fetchErr) throw fetchErr;

        const updatePayload = {
            updated_at: new Date()
        };
        if (status) updatePayload.status = status;
        if (severity) updatePayload.severity = severity;
        if (admin_remarks !== undefined) updatePayload.admin_remarks = admin_remarks;
        if (admin_id) {
            updatePayload.admin_id = admin_id;
            updatePayload.reviewed_at = new Date();
        }

        // Update status & severity
        const { data, error } = await supabase
            .from('landlord_reports')
            .update(updatePayload)
            .eq('id', id)
            .select('id, status, severity, admin_remarks, admin_id, reviewed_at, updated_at, landlord_id')
            .single();

        if (error) throw error;

        // If approved, deduct landlord trust score
        if (status === 'approved' && data && data.landlord_id) {
            const deduction = SEVERITY_TRUST_DEDUCTIONS[data.severity] || 5;

            // Fetch landlord current trust score
            const { data: landlordData } = await supabase
                .from('users')
                .select('landlord_trust_score')
                .eq('id', data.landlord_id)
                .maybeSingle();

            const currentScore = (landlordData && landlordData.landlord_trust_score !== null) ? landlordData.landlord_trust_score : 100;
            const newScore = Math.max(0, currentScore - deduction);

            await supabase
                .from('users')
                .update({ landlord_trust_score: newScore })
                .eq('id', data.landlord_id);
        }

        return data;
    },

    // ─── Update – Landlord Explanation ────────────────────────────────────────

    async submitLandlordExplanation(id, landlordId, explanation) {
        const { data: report, error: fetchErr } = await supabase
            .from('landlord_reports')
            .select('id, status, landlord_id, landlord_explanation')
            .eq('id', id)
            .eq('landlord_id', landlordId)
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!report) return { error: 'Report not found or access denied.' };
        if (report.status !== 'pending_admin_review') return { error: 'Explanation can only be submitted while the report is pending admin review.' };
        if (report.landlord_explanation) return { error: 'You have already submitted an explanation for this report.' };

        const { data, error } = await supabase
            .from('landlord_reports')
            .update({
                landlord_explanation: explanation,
                landlord_responded_at: new Date(),
                updated_at: new Date()
            })
            .eq('id', id)
            .select('id, landlord_explanation, landlord_responded_at, updated_at')
            .single();

        if (error) throw error;
        return { data };
    },

    // ─── Additional Evidence ──────────────────────────────────────────────────

    async addAdditionalEvidence(reportId, tenantId, files) {
        const { data: report, error: fetchErr } = await supabase
            .from('landlord_reports')
            .select('id, status, tenant_id')
            .eq('id', reportId)
            .eq('tenant_id', tenantId)
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!report) return { error: 'Report not found or access denied.' };
        if (report.status !== 'needs_more_evidence') return { error: 'Additional evidence can only be added when admin has requested more evidence.' };

        const rows = files.map(f => ({
            report_id: reportId,
            file_name: f.file_name,
            file_url:  f.file_url,
            file_path: f.file_path,
            file_type: f.file_type,
            file_size: f.file_size || null
        }));

        const { data: evidenceData, error: evidenceErr } = await supabase
            .from('landlord_report_evidence')
            .insert(rows)
            .select();

        if (evidenceErr) throw evidenceErr;

        const { error: updateErr } = await supabase
            .from('landlord_reports')
            .update({ status: 'pending_admin_review', updated_at: new Date() })
            .eq('id', reportId);

        if (updateErr) throw updateErr;

        return { data: evidenceData };
    }
};

module.exports = landlordReportModel;
