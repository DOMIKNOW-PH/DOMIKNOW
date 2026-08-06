const supabase = require('../config/supabaseClient');

// In-memory fallback map if Supabase table is not yet migrated
const memoryStore = new Map();

const reportMessageModel = {
    async addMessage({ report_type, report_id, sender_id, sender_role, recipient_role, message_text, attachment_url, attachment_path }) {
        const payload = {
            report_type,
            report_id,
            sender_id,
            sender_role: sender_role || 'admin',
            recipient_role: recipient_role || 'all',
            message_text: message_text || '',
            attachment_url: attachment_url || null,
            attachment_path: attachment_path || null,
            created_at: new Date()
        };

        try {
            const { data, error } = await supabase
                .from('report_messages')
                .insert([payload])
                .select(`
                    *,
                    sender:users!report_messages_sender_id_fkey ( id, full_name, email, role )
                `)
                .single();

            if (error) {
                console.warn('Supabase report_messages table insert notice:', error.message || error);
                // Memory store fallback
                const key = `${report_type}:${report_id}`;
                if (!memoryStore.has(key)) memoryStore.set(key, []);
                const mockMsg = { id: `mem_${Date.now()}_${Math.random().toString(36).substring(2,5)}`, ...payload };
                memoryStore.get(key).push(mockMsg);
                return mockMsg;
            }

            return data;
        } catch (err) {
            console.warn('Memory fallback used for report_messages:', err.message || err);
            const key = `${report_type}:${report_id}`;
            if (!memoryStore.has(key)) memoryStore.set(key, []);
            const mockMsg = { id: `mem_${Date.now()}_${Math.random().toString(36).substring(2,5)}`, ...payload };
            memoryStore.get(key).push(mockMsg);
            return mockMsg;
        }
    },

    async getMessagesByReportId(report_type, report_id) {
        try {
            const { data, error } = await supabase
                .from('report_messages')
                .select(`
                    *,
                    sender:users!report_messages_sender_id_fkey ( id, full_name, email, role )
                `)
                .eq('report_type', report_type)
                .eq('report_id', report_id)
                .order('created_at', { ascending: true });

            if (error) {
                const key = `${report_type}:${report_id}`;
                return memoryStore.get(key) || [];
            }

            return data || [];
        } catch (err) {
            const key = `${report_type}:${report_id}`;
            return memoryStore.get(key) || [];
        }
    }
};

module.exports = reportMessageModel;
