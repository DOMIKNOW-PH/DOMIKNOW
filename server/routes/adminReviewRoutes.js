const express = require('express');
const router = express.Router();
const adminReviewController = require('../controllers/adminReviewController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Admin property review queue
router.get('/properties/review', requireAuth, requireRole('admin'), adminReviewController.getPropertiesForReview);
router.get('/properties/:id/review', requireAuth, requireRole('admin'), adminReviewController.getPropertyReviewDetails);

// Approvals & Rejections
router.put('/properties/:id/approve', requireAuth, requireRole('admin'), adminReviewController.approveProperty);
router.put('/properties/:id/reject', requireAuth, requireRole('admin'), adminReviewController.rejectProperty);

module.exports = router;
