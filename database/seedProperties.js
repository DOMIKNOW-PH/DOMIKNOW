require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const supabase = require('../server/config/supabaseClient');

const sampleProperties = [
    {
        property: {
            property_name: "Siniloan Student Hub",
            property_type: "boarding_house",
            description: "Affordable boarding house rooms tailored for students. Extremely close to Laguna State Polytechnic University.",
            address: "G. Redor Street, Siniloan, Laguna",
            barangay: "G. Redor",
            municipality: "Siniloan",
            province: "Laguna",
            latitude: 14.4235,
            longitude: 121.4412,
            monthly_rent: 2200,
            max_occupants: 4,
            tenant_type_suitability: "student",
            house_rules: "Curfew at 10 PM. No loud music after 8 PM. Keep common areas clean.",
            status: "approved",
            average_rating: 4.8,
            feedback_count: 12,
            main_image_url: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
        },
        amenities: ["WiFi", "Study Area", "Near School", "Own CR"],
        feedback: {
            rating_average: 4.8,
            total_feedback: 12,
            positive_summary: "Very near LSPU. Great internet speed and comfortable study desk.",
            negative_summary: "Shared common kitchen can sometimes be a bit crowded in mornings."
        }
    },
    {
        property: {
            property_name: "Laguna Green Residences",
            property_type: "studio_unit",
            description: "Sleek and modern studio units with CCTV monitoring and private parking. Perfect for working professionals.",
            address: "Halayhayin Highway, Siniloan, Laguna",
            barangay: "Halayhayin",
            municipality: "Siniloan",
            province: "Laguna",
            latitude: 14.4211,
            longitude: 121.4452,
            monthly_rent: 4500,
            max_occupants: 2,
            tenant_type_suitability: "worker",
            house_rules: "Proper disposal of trash. Silent hours 10 PM to 6 AM. Visitors allowed until 9 PM.",
            status: "approved",
            average_rating: 4.6,
            feedback_count: 8,
            main_image_url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
        },
        amenities: ["CCTV", "Parking", "Air Conditioning", "Laundry Area"],
        feedback: {
            rating_average: 4.6,
            total_feedback: 8,
            positive_summary: "Safe gated security, silent neighborhood, and excellent water supply.",
            negative_summary: "A bit far from the main public transportation terminal."
        }
    },
    {
        property: {
            property_name: "Pandeño Student Bedspace",
            property_type: "bedspace",
            description: "Very cheap bedspace for active students. Fully equipped study hall and kitchen access.",
            address: "Pandeño Street, Siniloan, Laguna",
            barangay: "Pandeño",
            municipality: "Siniloan",
            province: "Laguna",
            latitude: 14.4262,
            longitude: 121.4398,
            monthly_rent: 1200,
            max_occupants: 6,
            tenant_type_suitability: "student",
            house_rules: "No drinking or smoking. Clean up after cooking in common kitchen. Guests are not allowed in rooms.",
            status: "approved",
            average_rating: 4.2,
            feedback_count: 15,
            main_image_url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80"
        },
        amenities: ["WiFi", "Kitchen Access", "Study Area", "Near School"],
        feedback: {
            rating_average: 4.2,
            total_feedback: 15,
            positive_summary: "Extremely affordable. Owners are friendly and wifi is stable.",
            negative_summary: "Rooms are shared with multiple students which can limit privacy."
        }
    },
    {
        property: {
            property_name: "Macasipac Family Townhouse",
            property_type: "house",
            description: "Spacious family home in a peaceful community. Large yard and pet friendly layout.",
            address: "Macasipac Road, Siniloan, Laguna",
            barangay: "Macasipac",
            municipality: "Siniloan",
            province: "Laguna",
            latitude: 14.4302,
            longitude: 121.4431,
            monthly_rent: 8500,
            max_occupants: 6,
            tenant_type_suitability: "family",
            house_rules: "Maintain general cleanliness. Pets allowed with vaccine records. Take care of lawns.",
            status: "approved",
            average_rating: 4.9,
            feedback_count: 5,
            main_image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
        },
        amenities: ["CCTV", "Parking", "Own CR", "Pet Friendly", "Laundry Area"],
        feedback: {
            rating_average: 4.9,
            total_feedback: 5,
            positive_summary: "Huge lawn space. Gated and perfect for families with kids and dogs.",
            negative_summary: "Electricity rates are on commercial standard tiers in this sub-subdivision."
        }
    },
    {
        property: {
            property_name: "Acevida Studio Suites",
            property_type: "studio_unit",
            description: "Premium studio unit near public transport. Complete with air conditioning and stable fiber Wi-Fi.",
            address: "Acevida Highway, Siniloan, Laguna",
            barangay: "Acevida",
            municipality: "Siniloan",
            province: "Laguna",
            latitude: 14.4248,
            longitude: 121.4489,
            monthly_rent: 5000,
            max_occupants: 2,
            tenant_type_suitability: "worker",
            house_rules: "No smoking inside units. Subletting is forbidden. Pay rent on time.",
            status: "approved",
            average_rating: 4.7,
            feedback_count: 4,
            main_image_url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
        },
        amenities: ["Air Conditioning", "Own CR", "CCTV", "WiFi"],
        feedback: {
            rating_average: 4.7,
            total_feedback: 4,
            positive_summary: "Modern and premium finish. AC cooling is superb.",
            negative_summary: "No direct car park facility. Only motorcycle slots."
        }
    },
    {
        property: {
            property_name: "Mendiola Cozy Rooms",
            property_type: "room_for_rent",
            description: "Private room for lease in a clean boarding establishment. Extremely close to G. Redor commercial square.",
            address: "Mendiola Street, Siniloan, Laguna",
            barangay: "Mendiola",
            municipality: "Siniloan",
            province: "Laguna",
            latitude: 14.4277,
            longitude: 121.4354,
            monthly_rent: 2000,
            max_occupants: 2,
            tenant_type_suitability: "student",
            house_rules: "No outside guests overnight. Conserve electricity and water. Curfew 11 PM.",
            status: "approved",
            average_rating: 3.9,
            feedback_count: 6,
            main_image_url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80"
        },
        amenities: ["WiFi", "Near School", "Study Area"],
        feedback: {
            rating_average: 3.9,
            total_feedback: 6,
            positive_summary: "Cheap rate. The landlord lives in the next property and is very supportive.",
            negative_summary: "Strict curfew limits returning if working on late projects."
        }
    },
    {
        property: {
            property_name: "Salubungan Transient Bedspace",
            property_type: "bedspace",
            description: "Perfect transient bedspace near Siniloan Public Market. Best for workers and travellers.",
            address: "Salubungan Street, Siniloan, Laguna",
            barangay: "Salubungan",
            municipality: "Siniloan",
            province: "Laguna",
            latitude: 14.4192,
            longitude: 121.4418,
            monthly_rent: 1000,
            max_occupants: 8,
            tenant_type_suitability: "general",
            house_rules: "No illegal activities. Keep personal belongings locked. Turn off appliances when not in use.",
            status: "approved",
            average_rating: 4.1,
            feedback_count: 9,
            main_image_url: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=800&q=80"
        },
        amenities: ["Kitchen Access", "Near Market", "WiFi"],
        feedback: {
            rating_average: 4.1,
            total_feedback: 9,
            positive_summary: "Extremely cheap and next to public market for easy food access.",
            negative_summary: "Noisy early in mornings due to market logistics."
        }
    },
    {
        property: {
            property_name: "Siniloan Central Apartment",
            property_type: "apartment",
            description: "Comfortable central apartment with direct access to local transportation hubs. Safe and gated layout.",
            address: "General Redor Street, Siniloan, Laguna",
            barangay: "G. Redor",
            municipality: "Siniloan",
            province: "Laguna",
            latitude: 14.4228,
            longitude: 121.4422,
            monthly_rent: 7000,
            max_occupants: 4,
            tenant_type_suitability: "family",
            house_rules: "Small pets allowed. Gated locks curfew 12 Midnight. Proper waste sorting required.",
            status: "approved",
            average_rating: 4.5,
            feedback_count: 10,
            main_image_url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80"
        },
        amenities: ["WiFi", "CCTV", "Own CR", "Laundry Area", "Pet Friendly"],
        feedback: {
            rating_average: 4.5,
            total_feedback: 10,
            positive_summary: "Centrally located, gated, safe parking, and nice layout.",
            negative_summary: "Cellular signal is a bit weak inside some ground floor rooms."
        }
    }
];

const seedProperties = async () => {
    console.log('Seeding properties data...');

    try {
        // Fetch a seeded user to represent landlord_id (optional, let's keep it null as approved properties can exist standalone or have null landlord_id for Objective 2)
        // Insert properties
        for (const item of sampleProperties) {
            // Check duplicate
            const { data: existing, error: checkErr } = await supabase
                .from('properties')
                .select('id')
                .eq('property_name', item.property.property_name)
                .maybeSingle();

            if (checkErr) throw checkErr;
            if (existing) {
                console.log(`Property '${item.property.property_name}' already seeded.`);
                continue;
            }

            // Insert property
            const { data: prop, error: propErr } = await supabase
                .from('properties')
                .insert([item.property])
                .select()
                .single();

            if (propErr) throw propErr;

            // Insert amenities
            const amenitiesToInsert = item.amenities.map(name => ({
                property_id: prop.id,
                amenity_name: name
            }));
            const { error: amenErr } = await supabase
                .from('property_amenities')
                .insert(amenitiesToInsert);

            if (amenErr) throw amenErr;

            // Insert feedback
            const feedbackToInsert = {
                property_id: prop.id,
                rating_average: item.feedback.rating_average,
                total_feedback: item.feedback.total_feedback,
                positive_summary: item.feedback.positive_summary,
                negative_summary: item.feedback.negative_summary
            };
            const { error: feedErr } = await supabase
                .from('property_feedback_summary')
                .insert([feedbackToInsert]);

            if (feedErr) throw feedErr;

            console.log(`Seeded: ${prop.property_name}`);
        }

        console.log('✅ Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message || err);
        process.exit(1);
    }
};

seedProperties();
