const supabase = require('../config/supabaseClient');

function mapReportStatus(item) {
    if (!item) return item;
    if (Array.isArray(item)) return item.map(mapReportStatus);
    let s = item.status;
    if (s === 'pending_admin_review' && item.admin_id) {
        s = 'in_review';
    } else if (s === 'rejected') {
        s = 'dismissed';
    }
    return { ...item, status: s };
}

const tenantReportModel = {

    // ─── Relationship Validation ──────────────────────────────────────────────

    /**
     * Check if a landlord has (or had) a lease with the given tenant.
     * Returns the lease record, or null if no relationship exists.
     */
    async checkLandlordTenantRelationship(landlordId, tenantId) {
        const { data, error } = await supabase
            .from('lease_records')
            .select('id, property_id, lease_number, lease_status')
            .eq('landlord_id', landlordId)
            .eq('tenant_id', tenantId)
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    /**
     * Get the specific lease record by ID, ensuring it belongs to this landlord+tenant pair.
     */
    async getLeaseSummary(leaseId, landlordId) {
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
                tenant:users!lease_records_tenant_id_fkey ( id, full_name, email )
            `)
            .eq('id', leaseId)
            .eq('landlord_id', landlordId)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    // ─── Create ───────────────────────────────────────────────────────────────

    async createTenantReport(reportData) {
        const { data, error } = await supabase
            .from('tenant_reports')
            .insert([{
                ...reportData,
                status: 'pending_admin_review'
            }])
            .select('id, landlord_id, tenant_id, lease_id, property_id, report_category, incident_date, incident_description, severity, status, created_at')
            .single();

        if (error) throw error;
        return mapReportStatus(data);
    },

    /**
     * Insert one or more evidence records linked to a report.
     * @param {string} reportId
     * @param {Array}  files – [{ file_name, file_url, file_path, file_type, file_size }]
     */
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
            .from('tenant_report_evidence')
            .insert(rows)
            .select();

        if (error) throw error;
        return data;
    },

    // ─── Read – Landlord ──────────────────────────────────────────────────────

    async findReportsByLandlordId(landlordId) {
        const { data, error } = await supabase
            .from('tenant_reports')
            .select(`
                id, report_category, incident_date, severity, status, admin_id,
                admin_remarks, created_at, updated_at,
                tenant:users!tenant_reports_tenant_id_fkey ( id, full_name, email ),
                properties ( property_name, unit_number, address ),
                lease_records ( lease_number, property_units ( unit_number ) )
            `)
            .eq('landlord_id', landlordId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return mapReportStatus(data || []);
    },

    // ─── Read – Tenant ────────────────────────────────────────────────────────

    async findReportsByTenantId(tenantId) {
        const { data, error } = await supabase
            .from('tenant_reports')
            .select(`
                id, report_category, incident_date, severity, status, admin_id,
                incident_description, admin_remarks,
                tenant_explanation, tenant_responded_at,
                created_at, reviewed_at,
                landlord:users!tenant_reports_landlord_id_fkey ( full_name ),
                properties ( property_name, unit_number )
            `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return mapReportStatus(data || []);
    },

    // ─── Read – Admin ─────────────────────────────────────────────────────────

    async findAllTenantReports() {
        const { data, error } = await supabase
            .from('tenant_reports')
            .select(`
                id, report_category, incident_date, severity, status, admin_id,
                admin_remarks, created_at, updated_at, reviewed_at,
                landlord:users!tenant_reports_landlord_id_fkey ( id, full_name, email ),
                tenant:users!tenant_reports_tenant_id_fkey ( id, full_name, email ),
                properties ( property_name, unit_number, address )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return mapReportStatus(data || []);
    },

    async findTenantReportById(id) {
        const { data, error } = await supabase
            .from('tenant_reports')
            .select(`
                *,
                landlord:users!tenant_reports_landlord_id_fkey ( id, full_name, email, contact_number ),
                tenant:users!tenant_reports_tenant_id_fkey ( id, full_name, email, contact_number ),
                properties ( id, property_name, address, unit_number ),
                lease_records ( id, lease_number, lease_status, lease_start_date, lease_end_date, monthly_rent, property_units ( unit_number, rental_style ) )
            `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return mapReportStatus(data || null);
    },

    async findEvidenceByReportId(reportId) {
        const { data, error } = await supabase
            .from('tenant_report_evidence')
            .select('*')
            .eq('report_id', reportId)
            .order('uploaded_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getPreviousReportsAgainstTenant(tenantId, excludeReportId) {
        let query = supabase
            .from('tenant_reports')
            .select(`
                id, report_category, severity, status, admin_id, incident_date, created_at,
                landlord:users!tenant_reports_landlord_id_fkey ( full_name )
            `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (excludeReportId) {
            query = query.neq('id', excludeReportId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return mapReportStatus(data || []);
    },

    // ─── Update – Admin Decision ──────────────────────────────────────────────

    async updateTenantReportStatus(id, { status, severity, admin_remarks, admin_id }) {
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

        const { data, error } = await supabase
            .from('tenant_reports')
            .update(updatePayload)
            .eq('id', id)
            .select('id, status, severity, admin_remarks, admin_id, reviewed_at, updated_at')
            .single();

        if (error) throw error;
        return mapReportStatus(data);
    },

    // ─── Update – Tenant Explanation ──────────────────────────────────────────

    async submitTenantExplanation(id, tenantId, explanation) {
        // First verify this report is against this tenant and still pending
        const { data: report, error: fetchErr } = await supabase
            .from('tenant_reports')
            .select('id, status, tenant_id, tenant_explanation')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!report) return { error: 'Report not found or access denied.' };
        if (report.status !== 'pending_admin_review') return { error: 'Explanation can only be submitted while the report is pending admin review.' };
        if (report.tenant_explanation) return { error: 'You have already submitted an explanation for this report.' };

        const { data, error } = await supabase
            .from('tenant_reports')
            .update({
                tenant_explanation: explanation,
                tenant_responded_at: new Date(),
                updated_at: new Date()
            })
            .eq('id', id)
            .select('id, tenant_explanation, tenant_responded_at, updated_at')
            .single();

        if (error) throw error;
        return { data };
    },

    // ─── Additional Evidence ──────────────────────────────────────────────────

    /**
     * Add additional evidence to an existing report (for needs_more_evidence flow).
     * Only allowed when status is 'needs_more_evidence'.
     */
    async addAdditionalEvidence(reportId, landlordId, files) {
        // Verify ownership and status
        const { data: report, error: fetchErr } = await supabase
            .from('tenant_reports')
            .select('id, status, landlord_id')
            .eq('id', reportId)
            .eq('landlord_id', landlordId)
            .maybeSingle();

        if (fetchErr) throw fetchErr;
        if (!report) return { error: 'Report not found or access denied.' };
        if (report.status !== 'needs_more_evidence') return { error: 'Additional evidence can only be added when admin has requested more evidence.' };

        // Add the evidence
        const rows = files.map(f => ({
            report_id: reportId,
            file_name: f.file_name,
            file_url:  f.file_url,
            file_path: f.file_path,
            file_type: f.file_type,
            file_size: f.file_size || null
        }));

        const { data: evidenceData, error: evidenceErr } = await supabase
            .from('tenant_report_evidence')
            .insert(rows)
            .select();

        if (evidenceErr) throw evidenceErr;

        // Reset status back to pending_admin_review
        const { error: updateErr } = await supabase
            .from('tenant_reports')
            .update({ status: 'pending_admin_review', updated_at: new Date() })
            .eq('id', reportId);

        if (updateErr) throw updateErr;

        return { data: evidenceData };
    }
};

module.exports = tenantReportModel;
