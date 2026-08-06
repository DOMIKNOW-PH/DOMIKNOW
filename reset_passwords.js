require('dotenv').config();
const bcrypt = require('bcrypt');
const supabase = require('./server/config/supabaseClient');

const run = async () => {
    try {
        const hash = await bcrypt.hash('Password123!', 12);
        console.log('Generated hash:', hash);

        // Reset tenant
        const { data: tenant, error: err1 } = await supabase
            .from('users')
            .update({ password_hash: hash })
            .eq('email', 'alphi0910@gmail.com')
            .select();
        
        if (err1) console.error('Tenant reset error:', err1);
        else console.log('Reset tenant:', tenant);

        // Reset landlord
        const { data: landlord, error: err2 } = await supabase
            .from('users')
            .update({ password_hash: hash })
            .eq('email', 'aone202601@gmail.com')
            .select();

        if (err2) console.error('Landlord reset error:', err2);
        else console.log('Reset landlord:', landlord);

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

run();
