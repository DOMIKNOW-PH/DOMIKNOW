require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const supabase = require('../server/config/supabaseClient');

const seedAdmin = async () => {
    const adminEmail = 'admin@domiknow.com';
    const adminPassword = 'AdminPassword2026!';
    const adminName = 'System Administrator';

    console.log('Starting Admin User seeding...');

    try {
        // 1. Check if admin already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('email', adminEmail)
            .maybeSingle();

        if (checkError) {
            throw checkError;
        }

        if (existingUser) {
            console.log(`Admin user with email ${adminEmail} already exists.`);
            process.exit(0);
        }

        // 2. Hash password using bcrypt
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        // 3. Insert admin user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
                full_name: adminName,
                email: adminEmail,
                password_hash: passwordHash,
                role: 'admin',
                is_verified: true,
                account_status: 'active',
                contact_number: '+63 900 000 0000',
                address: 'DomiKnow Head Office'
            }])
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        console.log('----------------------------------------------------');
        console.log('✅ Admin user successfully seeded!');
        console.log(`Email:    ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        console.log(`Name:     ${adminName}`);
        console.log('----------------------------------------------------');

        // 4. Create initial audit log
        const { error: logError } = await supabase
            .from('audit_logs')
            .insert([{
                user_id: newUser.id,
                action: 'SYSTEM_SEED',
                description: 'Initial system administrator account seeded successfully.'
            }]);

        if (logError) {
            console.warn('⚠️ Warning: Admin created but failed to write audit log:', logError.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin user:', error.message || error);
        process.exit(1);
    }
};

seedAdmin();
