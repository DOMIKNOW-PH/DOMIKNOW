const utilityModel = require('../models/utilityModel');
const leaseModel = require('../models/leaseModel');
const auditLogModel = require('../models/auditLogModel');
const responseHelper = require('../utils/responseHelper');
const supabase = require('../config/supabaseClient');

const utilityController = {
    async createUtilityRecord(req, res) {
        try {
            const { 
                lease_id, utility_type, billing_month, 
                previous_reading, current_reading, rate_per_unit, remarks 
            } = req.body;
            
            const landlordId = req.user.id;

            // 1. Validate inputs
            if (!lease_id || !utility_type || !billing_month || previous_reading === undefined || current_reading === undefined || rate_per_unit === undefined) {
                return responseHelper.error(res, 'All details (lease, type, month, readings, and rate) are required.');
            }

            // 2. Verify lease ownership & utility configuration rule
            const { data: lease, error: leaseErr } = await supabase
                .from('lease_records')
                .select('id, tenant_id, property_id, landlord_id, utilities_covered')
                .eq('id', lease_id)
                .maybeSingle();

            if (leaseErr) throw leaseErr;
            if (!lease || lease.landlord_id !== landlordId) {
                return responseHelper.error(res, 'Lease record not found or access denied.', null, 404);
            }

            // Check if utility is included in rent according to lease agreement
            const utilKey = (utility_type || '').toLowerCase().replace(/\s+/g, '_');
            const uConfig = lease.utilities_covered || {};
            let isIncluded = false;
            if (typeof uConfig === 'object' && !Array.isArray(uConfig)) {
                isIncluded = (uConfig[utilKey] === 'included' || uConfig[utility_type] === 'included');
            } else if (Array.isArray(uConfig)) {
                isIncluded = uConfig.includes(utility_type);
            }

            if (isIncluded) {
                return responseHelper.error(res, `Utility "${utility_type}" is configured as "Included in Monthly Rent" in the active Lease Agreement. Utility monitoring is disabled for included utilities.`);
            }

            // 3. Prevent negative consumption
            const prev = parseFloat(previous_reading);
            const curr = parseFloat(current_reading);
            const rate = parseFloat(rate_per_unit);

            if (curr < prev) {
                return responseHelper.error(res, 'Invalid readings: Current reading cannot be less than the previous reading.');
            }

            const consumption = curr - prev;
            const totalAmount = consumption * rate;

            // 4. Save utility record
            const utilityRecord = await utilityModel.createUtilityRecord({
                lease_id,
                tenant_id: lease.tenant_id,
                landlord_id: landlordId,
                property_id: lease.property_id,
                utility_type,
                billing_month,
                previous_reading: prev,
                current_reading: curr,
                consumption,
                rate_per_unit: rate,
                total_amount: totalAmount,
                remarks
            });

            // 5. Audit log
            await auditLogModel.log(landlordId, 'ADD_UTILITY_RECORD', `Landlord recorded utility usage (${utility_type}) for lease ${lease_id}`);

            return responseHelper.success(res, 'Utility consumption details recorded successfully.', utilityRecord, 201);

        } catch (error) {
            console.error('Create utility record error:', error);
            return responseHelper.error(res, 'Failed to log utility readings', error, 500);
        }
    },

    async getLandlordUtilities(req, res) {
        try {
            const list = await utilityModel.findByLandlordId(req.user.id);
            return responseHelper.success(res, 'Utilities logs retrieved successfully', list);
        } catch (error) {
            console.error('Get landlord utilities error:', error);
            return responseHelper.error(res, 'Failed to fetch utilities records', error, 500);
        }
    },

    async getTenantUtilities(req, res) {
        try {
            const list = await utilityModel.findByTenantId(req.user.id);
            return responseHelper.success(res, 'Tenant utilities logs retrieved successfully', list);
        } catch (error) {
            console.error('Get tenant utilities error:', error);
            return responseHelper.error(res, 'Failed to fetch utilities logs', error, 500);
        }
    }
};

module.exports = utilityController;
