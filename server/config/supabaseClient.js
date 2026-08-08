require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables. Check your .env file.');
}

// Create a single supabase client for interacting with your database
// IMPORTANT: Using service_role key allows bypassing Row Level Security.
// Do not expose this client to the frontend.
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = supabase;
