const supabase = require('../config/supabaseClient');

const adminModel = {
    async findPropertiesForReview() {
        const { data: properties, error } = await supabase
            .from('properties')
            .select(`
                id,
                property_name,
                property_type,
                address,
                monthly_rent,
                status,
                created_at,
                users!landlord_id (
                    full_name,
                    email
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (properties.length === 0) return [];

        const propertyIds = properties.map(p => p.id);

        // Fetch document counts
        const { data: docs, error: docsErr } = await supabase
            .from('property_documents')
            .select('property_id');
        if (docsErr) throw docsErr;

        // Fetch image counts
        const { data: imgs, error: imgsErr } = await supabase
            .from('property_images')
            .select('property_id');
        if (imgsErr) throw imgsErr;

        const docsMap = {};
        docs.forEach(d => {
            docsMap[d.property_id] = (docsMap[d.property_id] || 0) + 1;
        });

        const imgsMap = {};
        imgs.forEach(i => {
            imgsMap[i.property_id] = (imgsMap[i.property_id] || 0) + 1;
        });

        return properties.map(p => ({
            ...p,
            landlord_name: p.users ? p.users.full_name : 'Unknown Landlord',
            landlord_email: p.users ? p.users.email : 'N/A',
            landlord_phone: p.users ? (p.users.contact_number || 'N/A') : 'N/A',
            document_count: docsMap[p.id] || 0,
            documents_count: docsMap[p.id] || 0,
            image_count: imgsMap[p.id] || 0
        }));
    },

    async findPropertyReviewDetails(id) {
        const { data: property, error } = await supabase
            .from('properties')
            .select(`
                *,
                users!landlord_id (
                    full_name,
                    email,
                    contact_number
                )
            `)
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!property) return null;

        // Fetch amenities
        const { data: amenities, error: amenError } = await supabase
            .from('property_amenities')
            .select('amenity_name')
            .eq('property_id', id);
        if (amenError) throw amenError;

        // Fetch images
        const { data: images, error: imgError } = await supabase
            .from('property_images')
            .select('*')
            .eq('property_id', id);
        if (imgError) throw imgError;

        // Fetch documents
        const { data: documents, error: docError } = await supabase
            .from('property_documents')
            .select('*')
            .eq('property_id', id);
        if (docError) throw docError;

        // Fetch property units
        const { data: units, error: unitError } = await supabase
            .from('property_units')
            .select('*')
            .eq('property_id', id)
            .order('unit_number', { ascending: true });
        if (unitError && unitError.code !== '42P01') {
            console.warn('Units query notice in adminModel:', unitError.message);
        }

        return {
            ...property,
            landlord: property.users || null,
            landlord_name: property.users ? property.users.full_name : 'Unknown Landlord',
            landlord_email: property.users ? property.users.email : 'N/A',
            landlord_phone: property.users ? (property.users.contact_number || 'N/A') : 'N/A',
            amenities: (amenities || []).map(a => a.amenity_name),
            images: images || [],
            documents: documents || [],
            units: units || []
        };
    },

    async approveProperty(id, adminId) {
        const { data, error } = await supabase
            .from('properties')
            .update({
                status: 'approved',
                admin_reviewed_by: adminId,
                admin_reviewed_at: new Date(),
                rejection_reason: null,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async rejectProperty(id, adminId, reason) {
        const { data, error } = await supabase
            .from('properties')
            .update({
                status: 'rejected',
                admin_reviewed_by: adminId,
                admin_reviewed_at: new Date(),
                rejection_reason: reason,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = adminModel;
