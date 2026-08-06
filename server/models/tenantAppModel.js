const supabase = require('../config/supabaseClient');

const tenantAppModel = {
    async createApplication(appData) {
        const { data, error } = await supabase
            .from('tenant_applications')
            .insert([{
                ...appData,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findDuplicateApplication(tenantId, propertyId) {
        const { data, error } = await supabase
            .from('tenant_applications')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('property_id', propertyId)
            .eq('status', 'pending')
            .maybeSingle();

        if (error) throw error;
        return data || null;
    },

    async saveApplicationDocument(docData) {
        const { data, error } = await supabase
            .from('tenant_application_documents')
            .insert([docData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findByTenantId(tenantId) {
        // Query applications and join with property and landlord details
        const { data, error } = await supabase
            .from('tenant_applications')
            .select(`
                id,
                desired_move_in_date,
                status,
                landlord_remarks,
                created_at,
                properties (
                    property_name,
                    address,
                    users!landlord_id (
                        full_name
                    )
                ),
                property_units (
                    unit_number,
                    rental_style,
                    monthly_rent,
                    capacity
                ),
                unit_beds (
                    bed_label,
                    monthly_rent
                )
            `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async findApplicationDetails(id, tenantId) {
        const { data: application, error } = await supabase
            .from('tenant_applications')
            .select(`
                id,
                unit_id,
                bed_id,
                tenant_id,
                property_id,
                landlord_id,
                reservation_id,
                application_message,
                desired_move_in_date,
                status,
                landlord_remarks,
                created_at,

                properties (
                    property_name,
                    property_type,
                    monthly_rent,
                    address,
                    barangay,
                    house_rules,
                    users!landlord_id (
                        full_name,
                        email
                    )
                )
            `)
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .maybeSingle();

        if (error) throw error;
        if (!application) return null;

        // Fetch application documents
        const { data: documents, error: docError } = await supabase
            .from('tenant_application_documents')
            .select('*')
            .eq('application_id', id);

        if (docError) throw docError;

        let unit = null;
        let bed = null;
        if (application.unit_id) {
            try {
                const unitModel = require('./unitModel');
                unit = await unitModel.findById(application.unit_id);
                if (unit && application.bed_id && unit.beds) {
                    bed = unit.beds.find(b => b.id === application.bed_id) || null;
                }
            } catch (uErr) {
                console.warn('Note on unit fetching for application:', uErr.message);
            }
        }

        return {
            ...application,
            unit,
            bed,
            documents
        };
    }
};


module.exports = tenantAppModel;
