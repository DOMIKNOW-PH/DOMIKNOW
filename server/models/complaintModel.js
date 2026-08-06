const supabase = require('../config/supabaseClient');

const COMPLAINT_SELECT_BASE = `
    id,
    complaint_number,
    category,
    subject,
    description,
    status,
    resolution_notes,
    rejection_reason,
    attachment_url,
    submitted_at,
    resolved_at,
    closed_at,
    updated_at,
    lease_id,
    tenant_id,
    landlord_id,
    property_id,
    lease_records!complaints_lease_id_fkey (
        lease_number,
        lease_status
    ),
    tenant:users!complaints_tenant_id_fkey (
        full_name,
        email
    ),
    landlord:users!complaints_landlord_id_fkey (
        full_name,
        email
    ),
    properties (
        property_name,
        unit_number
    )
`;

const complaintModel = {
    /**
     * Generate a unique complaint number like CMP-20260726-0001
     */
    async generateComplaintNumber() {
        const today = new Date();
        const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');

        const { count } = await supabase
            .from('complaints')
            .select('id', { count: 'exact', head: true });

        const seq = String((count || 0) + 1).padStart(4, '0');
        return `CMP-${datePart}-${seq}`;
    },

    /**
     * Check if tenant has an active lease that matches the given leaseId.
     */
    async findActiveLease(tenantId, leaseId) {
        const { data, error } = await supabase
            .from('lease_records')
            .select('id, landlord_id, property_id')
            .eq('id', leaseId)
            .eq('tenant_id', tenantId)
            .in('lease_status', ['active', 'ended', 'terminated'])
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    /**
     * Create a new complaint record.
     */
    async createComplaint(data) {
        const { data: result, error } = await supabase
            .from('complaints')
            .insert([data])
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Create a status log entry.
     */
    async createStatusLog(logData) {
        const { error } = await supabase
            .from('complaint_status_logs')
            .insert([logData]);

        if (error) throw error;
    },

    /**
     * Get all complaints filed by a tenant.
     */
    async findByTenantId(tenantId) {
        const { data, error } = await supabase
            .from('complaints')
            .select(COMPLAINT_SELECT_BASE)
            .eq('tenant_id', tenantId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Get all complaints received by a landlord.
     */
    async findByLandlordId(landlordId, statusFilter = null) {
        let query = supabase
            .from('complaints')
            .select(COMPLAINT_SELECT_BASE)
            .eq('landlord_id', landlordId)
            .order('submitted_at', { ascending: false });

        if (statusFilter) {
            query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    /**
     * Fetch a single complaint by ID.
     */
    async findById(id) {
        const { data, error } = await supabase
            .from('complaints')
            .select(COMPLAINT_SELECT_BASE)
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    /**
     * Update a complaint's status and optional fields.
     */
    async updateStatus(id, updateData) {
        const { data, error } = await supabase
            .from('complaints')
            .update({ ...updateData, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get status log history for a complaint.
     */
    async getStatusLogs(complaintId) {
        const { data, error } = await supabase
            .from('complaint_status_logs')
            .select(`
                id,
                previous_status,
                new_status,
                remarks,
                updated_at,
                updated_by_user:users!complaint_status_logs_updated_by_fkey (
                    full_name
                )
            `)
            .eq('complaint_id', complaintId)
            .order('updated_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }
};

module.exports = complaintModel;
