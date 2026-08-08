const policyModel = require('../models/policyModel');
const responseHelper = require('../utils/responseHelper');
const auditLogModel = require('../models/auditLogModel');

const policyController = {
    /**
     * GET /api/policies
     * Public endpoint to get all active platform policies.
     */
    async getAllPolicies(req, res) {
        try {
            const policies = await policyModel.getAll();
            return responseHelper.success(res, 'Policies retrieved successfully.', policies);
        } catch (error) {
            console.error('[policyController] getAllPolicies error:', error);
            return responseHelper.error(res, 'Failed to retrieve policies.', error, 500);
        }
    },

    /**
     * GET /api/policies/:key
     * Get a specific policy section by key (tos, listing_standards, tenant_code, disciplinary_guidelines).
     */
    async getPolicyByKey(req, res) {
        try {
            const { key } = req.params;
            const policy = await policyModel.getByKey(key);
            if (!policy) {
                return responseHelper.error(res, 'Policy section not found.', null, 404);
            }
            return responseHelper.success(res, 'Policy retrieved successfully.', policy);
        } catch (error) {
            console.error('[policyController] getPolicyByKey error:', error);
            return responseHelper.error(res, 'Failed to retrieve policy.', error, 500);
        }
    },

    /**
     * PUT /api/admin/policies/:key
     * Admin endpoint to update and publish a policy section.
     */
    async updatePolicy(req, res) {
        try {
            const adminId = req.user.id;
            const { key } = req.params;
            const { title, version, summary, sections } = req.body;

            const existing = await policyModel.getByKey(key);
            if (!existing) {
                return responseHelper.error(res, 'Policy section not found.', null, 404);
            }

            const updated = await policyModel.updatePolicy(key, {
                title: title || existing.title,
                version: version || existing.version,
                summary: summary || existing.summary,
                sections: Array.isArray(sections) ? sections : existing.sections
            });

            await auditLogModel.log(
                adminId,
                'UPDATE_PLATFORM_POLICY',
                `Admin updated and published platform policy "${updated.title}" (${key}) version ${updated.version}`
            );

            return responseHelper.success(res, `Policy "${updated.title}" updated and published successfully.`, updated);
        } catch (error) {
            console.error('[policyController] updatePolicy error:', error);
            return responseHelper.error(res, 'Failed to update policy.', error, 500);
        }
    }
};

module.exports = policyController;
