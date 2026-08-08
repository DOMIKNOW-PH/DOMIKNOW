const supabase = require('../config/supabaseClient');

// In-memory fallback notifications store
let memoryNotifications = [];

const notificationModel = {
    async create(notificationData) {
        const item = {
            id: notificationData.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            user_id: notificationData.user_id,
            type: notificationData.type || 'admin_warning', // admin_warning, admin_suspension, report_resolved, report_dismissed, inquiry_message
            title: notificationData.title || 'System Notification',
            message: notificationData.message || '',
            reference_id: notificationData.reference_id || null,
            read_status: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        memoryNotifications.unshift(item);

        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([item])
                .select('*')
                .single();

            if (!error && data) return data;
        } catch (err) {
            console.warn('[notificationModel] Supabase storage fallback to memory notification store');
        }

        return item;
    },

    async findByUserId(userId) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                return data;
            }
        } catch (err) {
            console.warn('[notificationModel] Supabase query fallback to memory store');
        }

        return memoryNotifications.filter(n => n.user_id === userId);
    },

    async markAsRead(id, userId) {
        const item = memoryNotifications.find(n => n.id === id && n.user_id === userId);
        if (item) {
            item.read_status = true;
            item.updated_at = new Date().toISOString();
        }

        try {
            const { data, error } = await supabase
                .from('notifications')
                .update({ read_status: true, updated_at: new Date().toISOString() })
                .eq('id', id)
                .eq('user_id', userId)
                .select('*')
                .single();

            if (!error && data) return data;
        } catch (err) {
            console.warn('[notificationModel] Supabase markAsRead fallback');
        }

        return item || { id, read_status: true };
    },

    async markAllRead(userId) {
        memoryNotifications.forEach(n => {
            if (n.user_id === userId) {
                n.read_status = true;
                n.updated_at = new Date().toISOString();
            }
        });

        try {
            await supabase
                .from('notifications')
                .update({ read_status: true, updated_at: new Date().toISOString() })
                .eq('user_id', userId);
        } catch (err) {
            console.warn('[notificationModel] Supabase markAllRead fallback');
        }

        return true;
    },

    async delete(id, userId) {
        memoryNotifications = memoryNotifications.filter(n => !(n.id === id && n.user_id === userId));

        try {
            await supabase
                .from('notifications')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);
        } catch (err) {
            console.warn('[notificationModel] Supabase delete fallback');
        }

        return true;
    }
};

module.exports = notificationModel;
