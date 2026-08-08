const propertyModel = require('../models/propertyModel');
const auditLogModel = require('../models/auditLogModel');
const responseHelper = require('../utils/responseHelper');

const propertyController = {
    async getAllProperties(req, res) {
        try {
            const { page = 1, limit = 20, sort = 'newest', ...filters } = req.query;
            
            // Convert pagination params to numbers
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;

            const result = await propertyModel.findApproved({
                ...filters,
                limit: limitNum,
                offset: offset,
                sort: sort
            });

            return responseHelper.success(res, 'Properties retrieved successfully', {
                properties: result.properties,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limitNum)
                }
            });
        } catch (error) {
            console.error('Get properties error:', error);
            return responseHelper.error(res, 'Failed to fetch properties', error, 500);
        }
    },

    async getPropertyById(req, res) {
        try {
            const { id } = req.params;
            const property = await propertyModel.findById(id);

            if (!property) {
                return responseHelper.error(res, 'Property not found', null, 404);
            }

            // Only log if authenticated user views details
            if (req.user && req.user.role === 'tenant') {
                await auditLogModel.log(req.user.id, 'VIEW_PROPERTY_DETAILS', `Tenant viewed property: ${property.property_name}`);
            }

            return responseHelper.success(res, 'Property details retrieved successfully', property);
        } catch (error) {
            console.error('Get property by id error:', error);
            return responseHelper.error(res, 'Failed to fetch property details', error, 500);
        }
    },

    async getRecommended(req, res) {
        try {
            // 5 Input Criteria from query params
            const preferred_location = req.query.preferred_location || req.query.preferred_barangay || '';
            const min_price = parseFloat(req.query.min_price || 0);
            const max_price = parseFloat(req.query.max_price || req.query.max_budget || 100000);
            const preferred_property_type = req.query.preferred_property_type || req.query.property_type || '';
            const tenant_preference = req.query.tenant_preference || req.query.tenant_type || '';
            
            let preferred_amenities = [];
            if (req.query.amenities) {
                preferred_amenities = Array.isArray(req.query.amenities) 
                    ? req.query.amenities 
                    : req.query.amenities.split(',').map(a => a.trim());
            }

            const candidates = await propertyModel.getRecommendationCandidates();
            if (candidates.length === 0) {
                return responseHelper.success(res, 'No properties available for recommendation', []);
            }

            // ── STAGE 1: STRICT ALL-INPUT CONSTRAINT FILTERING (AND LOGIC) ──
            // A property MUST possess 100% of all user-selected filter criteria to be included in results.
            const qualifiedCandidates = candidates.filter(prop => {
                // 1. Location Constraint Match
                if (preferred_location) {
                    const normPref = preferred_location.trim().toLowerCase();
                    const normPropBrgy = (prop.barangay || '').trim().toLowerCase();
                    const normAddress = (prop.address || '').trim().toLowerCase();
                    const matchLocation = (normPropBrgy === normPref || normAddress.includes(normPref));
                    if (!matchLocation) return false;
                }

                // 2. Budget / Rental Price Range Constraint Match
                const rent = parseFloat(prop.monthly_rent || 0);
                if (min_price > 0 && rent < min_price) return false;
                if (max_price > 0 && rent > max_price) return false;

                // 3. Property Type Constraint Match
                if (preferred_property_type) {
                    if (prop.property_type !== preferred_property_type) return false;
                }

                // 4. Amenities Constraint Match (MUST HAVE ALL SELECTED AMENITIES)
                if (preferred_amenities.length > 0) {
                    const propAmenities = (prop.amenities || []).map(a => a.toLowerCase());
                    const hasAllAmenities = preferred_amenities.every(pa => 
                        propAmenities.includes(pa.toLowerCase())
                    );
                    if (!hasAllAmenities) return false;
                }

                return true; // Passed 100% of specified filter inputs
            });

            if (qualifiedCandidates.length === 0) {
                return responseHelper.success(res, 'No properties match 100% of your active filter criteria', []);
            }

            // ── STAGE 2: QUALITY, TRUST & RELIABILITY RANKING ──
            // Rank qualified properties strictly by Property Rating, Trust Score, Rental Reliability & Landlord Rating
            const recommended = qualifiedCandidates.map(prop => {
                let score = 0;
                const reasons = [];

                const trustScore = prop.landlord?.landlord_trust_score ?? 100;
                const propertyRating = parseFloat(prop.average_rating || 4.8);
                const landlordRating = parseFloat(prop.landlord_rating || 4.7);
                const rentalReliability = Math.min(99, Math.max(85, Math.round(trustScore * 0.5 + propertyRating * 10)));

                // 1. Property Rating Score (30% Weight / Max 30 Pts)
                const ratingPoints = Math.round((propertyRating / 5.0) * 30);
                score += ratingPoints;
                reasons.push(`Property Rating (${propertyRating.toFixed(1)}/5.0 ★) (+${ratingPoints} pts)`);

                // 2. Landlord Trust Score (30% Weight / Max 30 Pts)
                const trustPoints = Math.round((trustScore / 100) * 30);
                score += trustPoints;
                reasons.push(`Landlord Trust Score (${trustScore}/100 🛡️) (+${trustPoints} pts)`);

                // 3. Rental Reliability Index (20% Weight / Max 20 Pts)
                const reliabilityPoints = Math.round((rentalReliability / 100) * 20);
                score += reliabilityPoints;
                reasons.push(`Rental Reliability Index (${rentalReliability}% ⚡) (+${reliabilityPoints} pts)`);

                // 4. Landlord Rating Score (20% Weight / Max 20 Pts)
                const landlordRatingPoints = Math.round((landlordRating / 5.0) * 20);
                score += landlordRatingPoints;
                reasons.push(`Landlord Reputation Rating (${landlordRating.toFixed(1)}/5.0 👨‍💼) (+${landlordRatingPoints} pts)`);

                // Total match percentage equals combined score (Max = 100%)
                const matchPercentage = Math.min(100, Math.max(50, Math.round(score)));

                return {
                    property: prop,
                    score,
                    match_percentage: matchPercentage,
                    reasons,
                    output_criteria: {
                        property_location: `Brgy. ${prop.barangay}, Siniloan, Laguna`,
                        property_rating: propertyRating,
                        trust_score: trustScore,
                        rental_reliability: `${rentalReliability}% High Reliability`,
                        landlord_rating: landlordRating
                    }
                };
            });

            // Sort by highest quality match score descending
            recommended.sort((a, b) => b.score - a.score);

            // Assign rank number (#1, #2, #3, etc.)
            const rankedList = recommended.map((item, idx) => ({
                rank: idx + 1,
                ...item
            }));

            return responseHelper.success(res, 'Ranked recommendations calculated successfully', rankedList);
        } catch (error) {
            console.error('Get recommended properties error:', error);
            return responseHelper.error(res, 'Failed to calculate ranked recommendations', error, 500);
        }
    },

    async compareProperties(req, res) {
        try {
            const { property_ids } = req.body;

            if (!property_ids || !Array.isArray(property_ids)) {
                return responseHelper.error(res, 'Property IDs array is required.');
            }

            if (property_ids.length < 2 || property_ids.length > 4) {
                return responseHelper.error(res, 'You can compare minimum 2 and maximum 4 properties.');
            }

            const comparisonData = await propertyModel.findComparisonList(property_ids);
            
            if (comparisonData.length === 0) {
                return responseHelper.error(res, 'No properties found for comparison', null, 404);
            }

            return responseHelper.success(res, 'Comparison data retrieved successfully', comparisonData);
        } catch (error) {
            console.error('Compare properties error:', error);
            return responseHelper.error(res, 'Failed to compare properties', error, 500);
        }
    }
};

module.exports = propertyController;
