require('dotenv').config();
const supabase = require('./server/config/supabaseClient');

const query = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('email, password_hash, role')
            .eq('email', 'contractor@domiknow.com')
            .single();
        
        if (error) throw error;
        console.log('Contractor User Data:');
        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error querying contractor:', err);
    }
    process.exit(0);
};

query();
