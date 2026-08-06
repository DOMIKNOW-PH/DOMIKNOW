-- Create properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES users(id) ON DELETE SET NULL,
    property_name VARCHAR(255) NOT NULL,
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('apartment', 'boarding_house', 'bedspace', 'studio_unit', 'room_for_rent', 'house')),
    description TEXT,
    address TEXT NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    monthly_rent DECIMAL(10, 2) NOT NULL CHECK (monthly_rent > 0),
    max_occupants INTEGER NOT NULL DEFAULT 1 CHECK (max_occupants > 0),
    tenant_type_suitability VARCHAR(50) NOT NULL CHECK (tenant_type_suitability IN ('student', 'worker', 'family', 'general')),
    house_rules TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'unavailable', 'reserved')),
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    feedback_count INTEGER DEFAULT 0,
    main_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create property_amenities table
CREATE TABLE property_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    amenity_name VARCHAR(100) NOT NULL CHECK (amenity_name IN ('WiFi', 'CCTV', 'Parking', 'Kitchen Access', 'Laundry Area', 'Air Conditioning', 'Own CR', 'Study Area', 'Near School', 'Near Market', 'Pet Friendly')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create property_feedback_summary table
CREATE TABLE property_feedback_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    rating_average DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    total_feedback INTEGER NOT NULL DEFAULT 0,
    positive_summary TEXT,
    negative_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create property_reservations table
CREATE TABLE property_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    move_in_date DATE NOT NULL,
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
