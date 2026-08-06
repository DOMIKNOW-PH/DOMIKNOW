-- Maintenance Module Database Schema Patch

-- 1. Create maintenance_categories table
CREATE TABLE IF NOT EXISTS maintenance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(50) UNIQUE NOT NULL
);

-- Seed categories
INSERT INTO maintenance_categories (category_name) 
VALUES ('plumbing'), ('electrical'), ('aircon'), ('door'), ('roof'), ('internet'), ('appliance'), ('others')
ON CONFLICT (category_name) DO NOTHING;

-- 2. Modify maintenance_requests constraints and columns
ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_issue_category_check;
ALTER TABLE maintenance_requests ADD CONSTRAINT maintenance_requests_issue_category_check 
CHECK (issue_category IN ('plumbing', 'electrical', 'aircon', 'door', 'roof', 'internet', 'appliance', 'others'));

ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_priority_level_check;
ALTER TABLE maintenance_requests ADD CONSTRAINT maintenance_requests_priority_level_check 
CHECK (priority_level IN ('low', 'medium', 'high', 'emergency'));

ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS maintenance_requests_status_check;
ALTER TABLE maintenance_requests ADD CONSTRAINT maintenance_requests_status_check 
CHECK (status IN ('pending', 'approved', 'assigned', 'accepted', 'travelling', 'arrived', 'repairing', 'completed', 'verified', 'closed', 'rejected'));

-- Add columns to maintenance_requests to support assignment, progress tracking, and reporting
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS preferred_schedule VARCHAR(255),
ADD COLUMN IF NOT EXISTS unit_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS travel_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS repair_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS problem_found TEXT,
ADD COLUMN IF NOT EXISTS repair_performed TEXT,
ADD COLUMN IF NOT EXISTS recommendations TEXT,
ADD COLUMN IF NOT EXISTS before_photo_url TEXT,
ADD COLUMN IF NOT EXISTS after_photo_url TEXT,
ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS material_cost DECIMAL(10, 2) DEFAULT 0.00;

-- 3. Create maintenance_assignments table
CREATE TABLE IF NOT EXISTS maintenance_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    maintenance_personnel_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    instructions TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create maintenance_updates table (tracks progress status logs)
CREATE TABLE IF NOT EXISTS maintenance_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    status_update VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create maintenance_photos table
CREATE TABLE IF NOT EXISTS maintenance_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(50) CHECK (photo_type IN ('before', 'after', 'report')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create maintenance_materials table
CREATE TABLE IF NOT EXISTS maintenance_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    material_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

-- 7. Create maintenance_reports table
CREATE TABLE IF NOT EXISTS maintenance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    maintenance_personnel_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_found TEXT NOT NULL,
    repair_performed TEXT NOT NULL,
    materials_used TEXT,
    recommendations TEXT,
    labor_cost DECIMAL(10, 2) DEFAULT 0.00,
    material_cost DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
