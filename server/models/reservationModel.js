const supabase = require('../config/supabaseClient');

const reservationModel = {
    async createReservation(reservationData) {
        const { data, error } = await supabase
            .from('property_reservations')
            .insert([reservationData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findDuplicatePending(tenantId, propertyId) {
        const { data, error } = await supabase
            .from('property_reservations')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('property_id', propertyId)
            .eq('status', 'pending')
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    async findByTenantId(tenantId) {
        // Query reservations and join with property details
        // Note: Supabase allows nested selects for joins: property_reservations(id, status, ...), properties(property_name, address)
        const { data, error } = await supabase
            .from('property_reservations')
            .select(`
                id,
                reservation_date,
                move_in_date,
                message,
                status,
                created_at,
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

    async findAllReservations() {
        // Query all reservations and join with both user (tenant) details and property details
        const { data, error } = await supabase
            .from('property_reservations')
            .select(`
                id,
                reservation_date,
                move_in_date,
                message,
                status,
                created_at,
                users (
                    full_name,
                    email
                ),
                properties (
                    property_name,
                    address
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async findById(id) {
        const { data, error } = await supabase
            .from('property_reservations')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    async updateReservationStatus(id, status) {
        const { data, error } = await supabase
            .from('property_reservations')
            .update({ status, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = reservationModel;
