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

            // Run multi-criteria scoring algorithm
            const recommended = candidates.map(prop => {
                let score = 0;
                const reasons = [];

                // 1. Location match (Max 25 pts)
                if (preferred_location) {
                    if (prop.barangay.toLowerCase() === preferred_location.toLowerCase()) {
                        score += 25;
                        reasons.push(`Exact location match in Barangay ${prop.barangay} (+25 pts)`);
                    } else if ((prop.address || '').toLowerCase().includes(preferred_location.toLowerCase())) {
                        score += 15;
                        reasons.push(`Location matches area landmark "${preferred_location}" (+15 pts)`);
                    }
                } else {
                    score += 15;
                }

                // 2. Budget / Rental Price Range match (Max 25 pts)
                const rent = parseFloat(prop.monthly_rent || 0);
                if (rent >= min_price && rent <= max_price) {
                    score += 25;
                    reasons.push(`Monthly rent (₱${rent.toLocaleString()}) fits within budget (+25 pts)`);
                } else if (rent < min_price) {
                    score += 20;
                    reasons.push(`Monthly rent (₱${rent.toLocaleString()}) is below maximum budget (+20 pts)`);
                }

                // 3. Preferred Property Type match (Max 15 pts)
                if (preferred_property_type) {
                    if (prop.property_type === preferred_property_type) {
                        score += 15;
                        reasons.push(`Matches preferred property type "${preferred_property_type}" (+15 pts)`);
                    }
                } else {
                    score += 10;
                }

                // 4. Preferred Amenities match (Max 15 pts)
                if (preferred_amenities.length > 0) {
                    const matchedAmenities = (prop.amenities || []).filter(a => 
                        preferred_amenities.some(pa => pa.toLowerCase() === a.toLowerCase())
                    );
                    const amenityRatio = matchedAmenities.length / preferred_amenities.length;
                    const amenityScore = Math.round(amenityRatio * 15);
                    score += amenityScore;
                    if (matchedAmenities.length > 0) {
                        reasons.push(`Matches ${matchedAmenities.length} of ${preferred_amenities.length} requested amenities (+${amenityScore} pts)`);
                    }
                } else {
                    score += 10;
                }

                // 5. Tenant Preference / Suitability (Max 10 pts)
                if (tenant_preference) {
                    if (prop.tenant_type_suitability === tenant_preference || prop.tenant_type_suitability === 'general') {
                        score += 10;
                        reasons.push(`Matches tenant suitability trait of "${tenant_preference}" (+10 pts)`);
                    }
                } else {
                    score += 5;
                }

                // Output Criteria Calculation
                const trustScore = prop.landlord?.landlord_trust_score ?? 100;
                const propertyRating = parseFloat(prop.average_rating || 4.8);
                const landlordRating = parseFloat(prop.landlord_rating || 4.7);
                const rentalReliability = Math.min(99, Math.max(85, Math.round(trustScore * 0.5 + propertyRating * 10)));

                // Bonus criteria points for high quality metrics (Max 10 pts)
                if (trustScore >= 90) score += 5;
                if (propertyRating >= 4.5) score += 5;

                const matchPercentage = Math.min(100, Math.max(50, Math.round((score / 105) * 100)));

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

            // Sort by highest match percentage descending
            recommended.sort((a, b) => b.match_percentage - a.match_percentage);

            // Assign rank number
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
