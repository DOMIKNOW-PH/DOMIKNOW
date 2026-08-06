const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const userController = require('../controllers/userController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const handleValidationErrors = require('../middleware/validationMiddleware');

// Validation rules
const updateProfileValidation = [
    body('full_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 }).withMessage('Full name must be between 2 and 255 characters'),
    body('contact_number')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Contact number too long'),
    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Address too long'),
    body('profile_image_url')
        .optional()
        .trim()
        .isURL().withMessage('Invalid profile image URL')
];

const updateStatusValidation = [
    param('id')
        .isUUID().withMessage('Invalid user ID format'),
    body('account_status')
        .notEmpty().withMessage('Account status is required')
        .isIn(['pending', 'active', 'disabled', 'rejected']).withMessage('Invalid account status')
];

const userIdValidation = [
    param('id')
        .isUUID().withMessage('Invalid user ID format')
];

// Profile routes (all authenticated users)
router.get('/me', requireAuth, userController.getProfile);
router.put('/me', requireAuth, updateProfileValidation, handleValidationErrors, userController.updateProfile);

// Admin user management routes
router.get('/', requireAuth, requireRole('admin'), userController.getAllUsers);
router.get('/:id', requireAuth, requireRole('admin'), userIdValidation, handleValidationErrors, userController.getUserById);
router.put('/:id/status', requireAuth, requireRole('admin'), updateStatusValidation, handleValidationErrors, userController.updateUserStatus);

module.exports = router;
