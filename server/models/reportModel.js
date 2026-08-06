const supabase = require('../config/supabaseClient');

const reportModel = {
    // ----------------- Reports -----------------
    async createReport(reportData) {
        const { data, error } = await supabase
            .from('user_reports')
            .insert([{
                ...reportData,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findReportsByReporterId(reporterId) {
        const { data, error } = await supabase
            .from('user_reports')
            .select(`
                *,
                reported_user:users!user_reports_reported_user_id_fkey (
                    full_name
                ),
                properties (
                    property_name
                )
            `)
            .eq('reporter_id', reporterId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async findAllReports() {
        const { data, error } = await supabase
            .from('user_reports')
            .select(`
                *,
                reporter:users!user_reports_reporter_id_fkey (
                    full_name
                ),
                reported_user:users!user_reports_reported_user_id_fkey (
                    full_name
                ),
                properties (
                    property_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updateReportStatus(id, updatePayload) {
        const { data, error } = await supabase
            .from('user_reports')
            .update({
                ...updatePayload,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ----------------- Disputes -----------------
    async checkUserLeaseConnection(userId, leaseId, propertyId) {
        // Checks if user is tenant or landlord in the lease
        const { data, error } = await supabase
            .from('lease_records')
            .select('id')
            .eq('id', leaseId)
            .eq('property_id', propertyId)
            .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    async createDispute(disputeData) {
        const { data, error } = await supabase
            .from('disputes')
            .insert([{
                ...disputeData,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findDisputesByUserId(userId) {
        const { data, error } = await supabase
            .from('disputes')
            .select(`
                *,
                complainant:users!disputes_complainant_id_fkey (
                    full_name
                ),
                respondent:users!disputes_respondent_id_fkey (
                    full_name
                ),
                properties (
                    property_name
                )
            `)
            .or(`complainant_id.eq.${userId},respondent_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async findAllDisputes() {
        const { data, error } = await supabase
            .from('disputes')
            .select(`
                *,
                complainant:users!disputes_complainant_id_fkey (
                    full_name
                ),
                respondent:users!disputes_respondent_id_fkey (
                    full_name
                ),
                properties (
                    property_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updateDisputeStatus(id, updatePayload) {
        const { data, error } = await supabase
            .from('disputes')
            .update({
                ...updatePayload,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // ----------------- Policy Violations -----------------
    async createPolicyViolation(violationData) {
        const { data, error } = await supabase
            .from('policy_violations')
            .insert([{
                ...violationData,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findPolicyViolationsByUserId(userId) {
        const { data, error } = await supabase
            .from('policy_violations')
            .select(`
                *,
                reporter:users!policy_violations_reported_by_fkey (
                    full_name
                ),
                violator:users!policy_violations_violator_id_fkey (
                    full_name
                ),
                properties (
                    property_name
                )
            `)
            .or(`reported_by.eq.${userId},violator_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async findAllPolicyViolations() {
        const { data, error } = await supabase
            .from('policy_violations')
            .select(`
                *,
                reporter:users!policy_violations_reported_by_fkey (
                    full_name
                ),
                violator:users!policy_violations_violator_id_fkey (
                    full_name
                ),
                properties (
                    property_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async updatePolicyViolationStatus(id, updatePayload) {
        const { data, error } = await supabase
            .from('policy_violations')
            .update({
                ...updatePayload,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = reportModel;
