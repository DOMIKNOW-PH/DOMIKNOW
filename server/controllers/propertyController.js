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
            // Get inputs from query params
            const { tenant_type, preferred_barangay, max_budget, amenities } = req.query;

            const candidates = await propertyModel.getRecommendationCandidates();
            if (candidates.length === 0) {
                return responseHelper.success(res, 'No properties available for recommendation', []);
            }

            // Format amenities to check
            let searchAmenities = [];
            if (amenities) {
                searchAmenities = Array.isArray(amenities) ? amenities : [amenities];
            }

            // Run scoring algorithm
            const recommended = candidates.map(prop => {
                let score = 0;
                const reasons = [];

                // 1. Tenant suitability (+30 points)
                if (tenant_type && prop.tenant_type_suitability === tenant_type) {
                    score += 30;
                    reasons.push(`Matches your tenant suitability trait of "${tenant_type}" (+30 pts)`);
                }

                // 2. Barangay match (+25 points)
                if (preferred_barangay && prop.barangay.toLowerCase() === preferred_barangay.toLowerCase()) {
                    score += 25;
                    reasons.push(`Located in your preferred Barangay of "${prop.barangay}" (+25 pts)`);
                }

                // 3. Rent budget match (+20 points)
                if (max_budget && parseFloat(prop.monthly_rent) <= parseFloat(max_budget)) {
                    score += 20;
                    reasons.push(`Monthly rent (₱${prop.monthly_rent}) is within your maximum budget (+20 pts)`);
                }

                // 4. Amenities matching (+5 points per amenity)
                let matchingAmenitiesCount = 0;
                prop.amenities.forEach(amen => {
                    if (searchAmenities.includes(amen)) {
                        score += 5;
                        matchingAmenitiesCount++;
                    }
                });
                if (matchingAmenitiesCount > 0) {
                    reasons.push(`Matches ${matchingAmenitiesCount} of your preferred amenities (+${matchingAmenitiesCount * 5} pts)`);
                }

                // 5. High ratings (+15 or +10 points)
                if (prop.average_rating >= 4.5) {
                    score += 15;
                    reasons.push(`Exceptional quality average rating of ${prop.average_rating} (+15 pts)`);
                } else if (prop.average_rating >= 4.0) {
                    score += 10;
                    reasons.push(`Good quality average rating of ${prop.average_rating} (+10 pts)`);
                }

                // 6. Active feedback reviews (+5 points)
                if (prop.feedback_count > 0) {
                    score += 5;
                    reasons.push(`Verified user feedback reports exist (+5 pts)`);
                }

                return {
                    property: prop,
                    score,
                    reasons
                };
            });

            // Sort by highest score descending
            recommended.sort((a, b) => b.score - a.score);

            return responseHelper.success(res, 'Recommendations retrieved successfully', recommended);
        } catch (error) {
            console.error('Get recommended properties error:', error);
            return responseHelper.error(res, 'Failed to match recommendations', error, 500);
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
