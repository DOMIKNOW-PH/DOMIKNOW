const supabase = require('../config/supabaseClient');

const auditLogModel = {
    async log(userId, action, description) {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .insert([{
                    user_id: userId, // Can be null if system action before user exists
                    action: action,
                    description: description || null
                }]);
                
            if (error) {
                console.error('Failed to write audit log:', error);
            }
            return data;
        } catch (err) {
            console.error('Audit log exception:', err);
        }
    }
};

module.exports = auditLogModel;
