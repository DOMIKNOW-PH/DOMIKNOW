const supabase = require('../config/supabaseClient');

const paymentModel = {
    async createPaymentRecord(paymentData) {
        const { data, error } = await supabase
            .from('payment_records')
            .insert([{
                ...paymentData,
                payment_status: 'pending_verification'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async findByTenantId(tenantId) {
        const { data, error } = await supabase
            .from('payment_records')
            .select(`
                id,
                payment_amount,
                payment_method,
                payment_reference_number,
                payment_proof_url,
                payment_proof_path,
                payment_status,
                verification_remarks,
                submitted_at,
                billing_records (
                    id,
                    billing_month,
                    total_amount,
                    billing_status
                ),
                properties (
                    property_name
                )
            `)
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async findByLandlordId(landlordId) {
        const { data, error } = await supabase
            .from('payment_records')
            .select(`
                id,
                payment_amount,
                payment_method,
                payment_reference_number,
                payment_proof_url,
                payment_proof_path,
                payment_status,
                verification_remarks,
                submitted_at,
                users!payment_records_tenant_id_fkey (
                    full_name,
                    email
                ),
                billing_records (
                    id,
                    billing_month,
                    total_amount,
                    billing_status
                ),
                properties (
                    property_name,
                    landlord_id
                )
            `)
            .eq('landlord_id', landlordId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async verifyPayment(id, landlordId, paymentStatus, remarks) {
        // Enforce ownership check
        const { data: payment, error: checkError } = await supabase
            .from('payment_records')
            .select('id, billing_id, payment_amount, landlord_id')
            .eq('id', id)
            .maybeSingle();

        if (checkError) throw checkError;
        if (!payment || payment.landlord_id !== landlordId) {
            return null;
        }

        // Update payment status
        const { data: updatedPayment, error } = await supabase
            .from('payment_records')
            .update({
                payment_status: paymentStatus,
                verification_remarks: remarks,
                verified_at: new Date(),
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Update the related billing status
        if (paymentStatus === 'verified') {
            // Get billing total amount
            const { data: billing, error: billingError } = await supabase
                .from('billing_records')
                .select('total_amount')
                .eq('id', payment.billing_id)
                .single();

            if (billingError) throw billingError;

            const finalStatus = parseFloat(payment.payment_amount) >= parseFloat(billing.total_amount)
                ? 'paid'
                : 'partially_paid';

            const { error: updateBillingError } = await supabase
                .from('billing_records')
                .update({ billing_status: finalStatus, updated_at: new Date() })
                .eq('id', payment.billing_id);

            if (updateBillingError) throw updateBillingError;
        } else if (paymentStatus === 'rejected') {
            // Revert billing status back to pending_payment on rejection
            const { error: updateBillingError } = await supabase
                .from('billing_records')
                .update({ billing_status: 'pending_payment', updated_at: new Date() })
                .eq('id', payment.billing_id);

            if (updateBillingError) throw updateBillingError;
        }

        return updatedPayment;
    },

    async findAllPayments() {
        const { data, error } = await supabase
            .from('payment_records')
            .select(`
                id,
                payment_amount,
                payment_method,
                payment_reference_number,
                payment_proof_url,
                payment_proof_path,
                payment_status,
                verification_remarks,
                submitted_at,
                users:users!payment_records_tenant_id_fkey (
                    full_name,
                    email
                ),
                landlord:users!payment_records_landlord_id_fkey (
                    full_name,
                    email
                ),
                billing_records (
                    billing_month
                ),
                properties (
                    property_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};

module.exports = paymentModel;
