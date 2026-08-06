const supabase = require('../config/supabaseClient');

const verificationModel = {
    async saveCode(userId, email, code, expiresAt) {
        const { data, error } = await supabase
            .from('email_verifications')
            .insert([{
                user_id: userId,
                email: email,
                verification_code: code,
                expires_at: expiresAt,
                is_used: false
            }])
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },

    async findLatestCode(email) {
        const { data, error } = await supabase
            .from('email_verifications')
            .select('*')
            .eq('email', email)
            .eq('is_used', false)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    },

    async markUsed(id) {
        const { data, error } = await supabase
            .from('email_verifications')
            .update({ is_used: true })
            .eq('id', id)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    }
};

module.exports = verificationModel;
