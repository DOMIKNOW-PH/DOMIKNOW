require('dotenv').config();
const supabase = require('./server/config/supabaseClient');

const query = async () => {
    try {
        console.log('Querying users...');
        const { data: users, error: err } = await supabase.from('users').select('id, email, role, full_name');
        if (err) console.error(err);
        console.log(users);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};
query();
