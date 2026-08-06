const supabase = require('../config/supabaseClient');

const utilityModel = {
    async createUtilityRecord(recordData) {
        const { data, error } = await supabase
            .from('utility_records')
            .insert([recordData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findByLandlordId(landlordId) {
        const { data, error } = await supabase
            .from('utility_records')
            .select(`
                id,
                utility_type,
                billing_month,
                previous_reading,
                current_reading,
                consumption,
                rate_per_unit,
                total_amount,
                remarks,
                created_at,
                users!utility_records_tenant_id_fkey (
                    full_name
                ),
                properties (
                    property_name
                )
            `)
            .eq('landlord_id', landlordId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async findByTenantId(tenantId) {
        const { data, error } = await supabase
            .from('utility_records')
            .select(`
                id,
                utility_type,
                billing_month,
                previous_reading,
                current_reading,
                consumption,
                rate_per_unit,
                total_amount,
                remarks,
                created_at,
                properties (
                    property_name
                )
            `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};

module.exports = utilityModel;
