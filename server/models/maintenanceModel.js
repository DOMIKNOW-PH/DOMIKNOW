const supabase = require('../config/supabaseClient');

const maintenanceModel = {
    async findActiveLease(tenantId, propertyId, leaseId) {
        const { data, error } = await supabase
            .from('lease_records')
            .select('id, landlord_id')
            .eq('id', leaseId)
            .eq('tenant_id', tenantId)
            .eq('property_id', propertyId)
            .eq('lease_status', 'active')
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    async createRequest(requestData) {
        const { data, error } = await supabase
            .from('maintenance_requests')
            .insert([{
                ...requestData,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findByTenantId(tenantId) {
        const { data, error } = await supabase
            .from('maintenance_requests')
            .select(`
                id,
                issue_title,
                issue_category,
                priority_level,
                status,
                created_at,
                completed_at,
                assigned_maintenance_id,
                preferred_schedule,
                unit_number,
                rejection_reason,
                labor_cost,
                material_cost,
                users!maintenance_requests_assigned_maintenance_id_fkey (
                    full_name
                ),
                properties (
                    property_name,
                    address
                )
            `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async findByLandlordId(landlordId) {
        const { data, error } = await supabase
            .from('maintenance_requests')
            .select(`
                id,
                issue_title,
                issue_category,
                priority_level,
                status,
                created_at,
                preferred_schedule,
                unit_number,
                users!maintenance_requests_tenant_id_fkey (
                    full_name
                ),
                properties (
                    property_name,
                    address
                ),
                assigned_maintenance:users!maintenance_requests_assigned_maintenance_id_fkey (
                    full_name
                )
            `)
            .eq('landlord_id', landlordId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async findRequestDetails(id) {
        const { data, error } = await supabase
            .from('maintenance_requests')
            .select(`
                *,
                tenant:users!maintenance_requests_tenant_id_fkey (
                    id,
                    full_name,
                    email,
                    contact_number
                ),
                properties (
                    id,
                    property_name,
                    address
                ),
                assigned_maintenance:users!maintenance_requests_assigned_maintenance_id_fkey (
                    id,
                    full_name,
                    email,
                    contact_number
                )
            `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async assignMaintenance(id, assignedMaintenanceId, remarks) {
        const { data, error } = await supabase
            .from('maintenance_requests')
            .update({
                assigned_maintenance_id: assignedMaintenanceId,
                status: 'assigned',
                landlord_remarks: remarks,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findByMaintenanceId(maintenanceId) {
        const { data, error } = await supabase
            .from('maintenance_requests')
            .select(`
                id,
                issue_title,
                issue_description,
                issue_category,
                priority_level,
                status,
                landlord_remarks,
                created_at,
                preferred_schedule,
                unit_number,
                users!maintenance_requests_tenant_id_fkey (
                    full_name
                ),
                properties (
                    property_name,
                    address
                )
            `)
            .eq('assigned_maintenance_id', maintenanceId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updateRequestStatus(id, updateData) {
        const { data, error } = await supabase
            .from('maintenance_requests')
            .update({
                ...updateData,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async createAssignment(assignmentData) {
        const { data, error } = await supabase
            .from('maintenance_assignments')
            .insert([assignmentData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findAssignment(requestId) {
        const { data, error } = await supabase
            .from('maintenance_assignments')
            .select(`
                *,
                maintenance_personnel:users (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('maintenance_request_id', requestId)
            .order('assigned_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    async createProgressUpdate(updateData) {
        const { data, error } = await supabase
            .from('maintenance_updates')
            .insert([updateData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findProgressUpdates(requestId) {
        const { data, error } = await supabase
            .from('maintenance_updates')
            .select('*')
            .eq('maintenance_request_id', requestId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async addMaterial(materialData) {
        const { data, error } = await supabase
            .from('maintenance_materials')
            .insert([materialData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteRequestMaterials(requestId) {
        const { error } = await supabase
            .from('maintenance_materials')
            .delete()
            .eq('maintenance_request_id', requestId);

        if (error) throw error;
    },

    async findMaterials(requestId) {
        const { data, error } = await supabase
            .from('maintenance_materials')
            .select('*')
            .eq('maintenance_request_id', requestId);

        if (error) throw error;
        return data || [];
    },

    async createReport(reportData) {
        const { data, error } = await supabase
            .from('maintenance_reports')
            .insert([reportData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findReport(requestId) {
        const { data, error } = await supabase
            .from('maintenance_reports')
            .select('*')
            .eq('maintenance_request_id', requestId)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    async findAllRequests() {
        const { data, error } = await supabase
            .from('maintenance_requests')
            .select(`
                *,
                tenant:users!maintenance_requests_tenant_id_fkey (
                    full_name
                ),
                properties (
                    property_name
                ),
                assigned_maintenance:users!maintenance_requests_assigned_maintenance_id_fkey (
                    full_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};

module.exports = maintenanceModel;
