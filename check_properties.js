// Quick script to check properties in database
const supabase = require('./server/config/supabaseClient');

async function checkProperties() {
    console.log('\n=== CHECKING PROPERTIES IN DATABASE ===\n');
    
    try {
        // Get ALL properties (no filter)
        const { data: allProperties, error: allError } = await supabase
            .from('properties')
            .select('id, property_name, status, created_at')
            .order('created_at', { ascending: false });
        
        if (allError) {
            console.error('❌ Error fetching properties:', allError);
            return;
        }
        
        console.log(`📊 Total Properties: ${allProperties.length}\n`);
        
        if (allProperties.length === 0) {
            console.log('⚠️  NO PROPERTIES FOUND IN DATABASE');
            console.log('   You need to register properties first!');
            return;
        }
        
        // Count by status
        const statusCounts = {};
        allProperties.forEach(prop => {
            statusCounts[prop.status] = (statusCounts[prop.status] || 0) + 1;
        });
        
        console.log('Status Breakdown:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            const emoji = status === 'approved' ? '✅' : status === 'pending_review' ? '⏳' : '❌';
            console.log(`  ${emoji} ${status}: ${count}`);
        });
        
        console.log('\n--- Property Details ---\n');
        allProperties.forEach((prop, index) => {
            const statusEmoji = prop.status === 'approved' ? '✅' : prop.status === 'pending_review' ? '⏳' : '❌';
            console.log(`${index + 1}. ${statusEmoji} ${prop.property_name}`);
            console.log(`   ID: ${prop.id}`);
            console.log(`   Status: ${prop.status}`);
            console.log(`   Created: ${new Date(prop.created_at).toLocaleString()}\n`);
        });
        
        // Get approved properties (what the API returns)
        const { data: approvedProperties, error: approvedError } = await supabase
            .from('properties')
            .select('id, property_name')
            .eq('status', 'approved');
        
        if (approvedError) {
            console.error('❌ Error fetching approved properties:', approvedError);
            return;
        }
        
        console.log(`\n🎯 APPROVED Properties (shown on landing page): ${approvedProperties.length}`);
        
        if (approvedProperties.length === 0) {
            console.log('\n⚠️  NO APPROVED PROPERTIES!');
            console.log('   Properties with status "pending_review" need admin approval.');
            console.log('   \n📝 TO FIX:');
            console.log('   1. Login as admin');
            console.log('   2. Go to: Admin → Property Review & Approval');
            console.log('   3. Review and approve properties');
            console.log('   4. Refresh the landing page\n');
        } else {
            console.log('\n✅ These properties will show on the landing page:');
            approvedProperties.forEach((prop, index) => {
                console.log(`   ${index + 1}. ${prop.property_name} (${prop.id})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkProperties();
