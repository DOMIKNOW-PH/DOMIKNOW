const supabase = require('../config/supabaseClient');

// Structured fallback default policies for DomiKnow platform
const DEFAULT_POLICIES = {
    tos: {
        key: 'tos',
        title: 'Platform Terms of Service (TOS)',
        category: 'Legal & Governance',
        version: 'v2.4 (2026)',
        last_updated: '2026-08-01',
        effective_date: '2026-08-01',
        summary: 'Core rules governing landlord and tenant conduct, account obligations, payment security, and dispute escalation on DomiKnow.',
        sections: [
            {
                heading: '1. Account Integrity & Identity Verification',
                content: 'All users must provide accurate identity verification details during registration. Impersonation, false contact details, or maintaining fraudulent accounts will result in immediate permanent account termination.'
            },
            {
                heading: '2. Rental Application & Financial Safety',
                content: 'All rental application fees, security deposits, and monthly rent transactions processed through DomiKnow are protected under digital receipt tracking. Direct off-platform payment solicitations intended to bypass platform safeguards are strictly prohibited.'
            },
            {
                heading: '3. Platform Conduct & Zero-Tolerance Harassment',
                content: 'Harassment, intimidation, discrimination, or offensive behavior directed at tenants, landlords, or property maintenance staff will lead to instant disciplinary action under Admin Triage.'
            }
        ]
    },
    listing_standards: {
        key: 'listing_standards',
        title: 'Property Listing & Building Safety Standards',
        category: 'Landlord Regulations',
        version: 'v1.8 (2026)',
        last_updated: '2026-08-01',
        effective_date: '2026-08-01',
        summary: 'Mandatory housing standards, fire safety compliance, and document verification rules required for property approval in Siniloan.',
        sections: [
            {
                heading: '1. Legal Document Verification',
                content: 'Landlords registering properties must submit valid proof of ownership (Barangay Clearance, Business Permit, or Property Title). Unverified listings will be rejected during Admin Review.'
            },
            {
                heading: '2. Habitability & Structural Standards',
                content: 'Units offered for per-bed or whole-room lease must possess adequate ventilation, functional sanitary facilities (CR), emergency exits, and clean water access.'
            },
            {
                heading: '3. Transparent Unit Pricing & Bed Allocation',
                content: 'All listed monthly rent rates, utility terms, and bed space capacities must reflect actual room conditions. Undisclosed hidden fees or over-capacity overcrowding violate listing standards.'
            }
        ]
    },
    tenant_code: {
        key: 'tenant_code',
        title: 'Tenant Code of Conduct & Quiet Hours Policy',
        category: 'Tenant Regulations',
        version: 'v2.1 (2026)',
        last_updated: '2026-08-01',
        effective_date: '2026-08-01',
        summary: 'Standard community rules for room sharing, guest privileges, utility usage, and quiet hours compliance in residential units.',
        sections: [
            {
                heading: '1. Quiet Hours & Noise Control',
                content: 'Strict quiet hours are observed between 10:00 PM and 6:00 AM daily. Loud music, shouting, or disruptive social gatherings during quiet hours are prohibited.'
            },
            {
                heading: '2. Shared Space Etiquette & Common Utilities',
                content: 'Tenants occupying per-bed spaces must respect room-mate privacy, keep common areas clean, and avoid unauthorized modification of electrical fixtures.'
            },
            {
                heading: '3. Visitor Policy & Overnight Stay Rules',
                content: 'Visitors must be registered according to the specific property house rules. Overnight guests are subject to prior landlord approval and gender policy restrictions.'
            }
        ]
    },
    disciplinary_guidelines: {
        key: 'disciplinary_guidelines',
        title: 'Disciplinary Action & Account Suspension Policy',
        category: 'Admin Sanction Matrix',
        version: 'v3.0 (2026)',
        last_updated: '2026-08-07',
        effective_date: '2026-08-07',
        summary: 'Enforcement matrix detailing the automatic system penalties, warning protocols, suspension terms, and permanent ban procedures executed by Admin Triage.',
        sections: [
            {
                heading: '1. Level 1 — Formal Warning Notice',
                content: 'Issued for minor, first-time infractions (e.g., minor noise complaint, late submission of documentation). The warning is logged in the user audit trail without restricting login access.'
            },
            {
                heading: '2. Level 2 — Temporary Account Suspension (7, 14, 30 Days)',
                content: 'Enforced for repeated infractions, non-compliance with dispute agreements, or property damage. Account status is set to Disabled, blocking login access for the specified duration.'
            },
            {
                heading: '3. Level 3 — Permanent Account Ban',
                content: 'Applied in response to severe platform violations, fraud, harassment, or safety threats. Account access is permanently disabled and landlord listings are automatically deactivated.'
            }
        ]
    }
};

// In-memory store for active policies when database table is omitted
let memoryPolicies = { ...DEFAULT_POLICIES };

const policyModel = {
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('platform_policies')
                .select('*');
            
            if (error || !data || data.length === 0) {
                return Object.values(memoryPolicies);
            }
            return data;
        } catch (err) {
            return Object.values(memoryPolicies);
        }
    },

    async getByKey(key) {
        try {
            const { data, error } = await supabase
                .from('platform_policies')
                .select('*')
                .eq('key', key)
                .single();

            if (error || !data) {
                return memoryPolicies[key] || DEFAULT_POLICIES[key] || null;
            }
            return data;
        } catch (err) {
            return memoryPolicies[key] || DEFAULT_POLICIES[key] || null;
        }
    },

    async updatePolicy(key, updateData) {
        const existing = memoryPolicies[key] || DEFAULT_POLICIES[key] || {};
        const updated = {
            ...existing,
            ...updateData,
            key,
            last_updated: new Date().toISOString().split('T')[0],
            updated_at: new Date()
        };

        memoryPolicies[key] = updated;

        try {
            const { data, error } = await supabase
                .from('platform_policies')
                .upsert(updated, { onConflict: 'key' })
                .select('*')
                .single();

            if (!error && data) return data;
        } catch (err) {
            console.warn('[policyModel] Supabase storage fallback to memory policy store');
        }

        return updated;
    }
};

module.exports = policyModel;
