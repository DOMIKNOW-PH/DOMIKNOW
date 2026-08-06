const userModel = require('../models/userModel');
const auditLogModel = require('../models/auditLogModel');
const responseHelper = require('../utils/responseHelper');

const userController = {
    async getProfile(req, res) {
        try {
            const user = await userModel.findById(req.user.id);
            if (!user) {
                return responseHelper.error(res, 'User not found', null, 404);
            }
            return responseHelper.success(res, 'Profile retrieved', user);
        } catch (error) {
            console.error('Get profile error:', error);
            return responseHelper.error(res, 'Failed to fetch profile', error, 500);
        }
    },

    async updateProfile(req, res) {
        try {
            // Only allow updating specific fields
            const { full_name, contact_number, address, profile_image_url } = req.body;
            
            const updatedUser = await userModel.updateProfile(req.user.id, {
                full_name,
                contact_number,
                address,
                profile_image_url
            });

            await auditLogModel.log(req.user.id, 'PROFILE_UPDATE', 'User updated their profile.');

            return responseHelper.success(res, 'Profile updated successfully', updatedUser);
        } catch (error) {
            console.error('Update profile error:', error);
            return responseHelper.error(res, 'Failed to update profile', error, 500);
        }
    },

    // Admin routes
    async getAllUsers(req, res) {
        try {
            const users = await userModel.getAllUsers();
            return responseHelper.success(res, 'Users retrieved', users);
        } catch (error) {
            console.error('Get all users error:', error);
            return responseHelper.error(res, 'Failed to fetch users', error, 500);
        }
    },

    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await userModel.findById(id);
            if (!user) {
                return responseHelper.error(res, 'User not found', null, 404);
            }
            return responseHelper.success(res, 'User retrieved', user);
        } catch (error) {
            console.error('Get user by id error:', error);
            return responseHelper.error(res, 'Failed to fetch user', error, 500);
        }
    },

    async updateUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { account_status } = req.body;

            const allowedStatuses = ['active', 'disabled', 'rejected', 'pending'];
            if (!allowedStatuses.includes(account_status)) {
                return responseHelper.error(res, 'Invalid account status');
            }

            const updatedUser = await userModel.updateStatus(id, account_status);

            await auditLogModel.log(req.user.id, `ADMIN_USER_STATUS_UPDATE`, `Admin changed user ${id} status to ${account_status}`);

            return responseHelper.success(res, `User status updated to ${account_status}`, updatedUser);
        } catch (error) {
            console.error('Update user status error:', error);
            return responseHelper.error(res, 'Failed to update user status', error, 500);
        }
    }
};

module.exports = userController;
