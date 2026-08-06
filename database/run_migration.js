require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigration() {
    const sqlPath = path.join(__dirname, 'property_units_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Attempt direct database passwords or connection URLs if available, or try common default ports
    const projectRef = 'lxbtoohaopokuenmdmia';
    const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

    if (!dbPassword) {
        console.log('⚠️ SUPABASE_DB_PASSWORD not set in env. Testing connection options...');
    }

    const connectionString = process.env.DATABASE_URL || `postgres://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to Supabase PostgreSQL database!');
        console.log('Executing migration script...');
        await client.query(sql);
        console.log('✅ Migration completed successfully!');
        await client.end();
    } catch (err) {
        console.error('❌ Migration error via pg:', err.message);
    }
}

runMigration();
