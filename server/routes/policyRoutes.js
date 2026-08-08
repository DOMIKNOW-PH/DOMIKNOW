const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Public routes (accessible to tenants, landlords, guests)
router.get('/', policyController.getAllPolicies);
router.get('/:key', policyController.getPolicyByKey);

// Admin-only management routes
router.put('/admin/:key', requireAuth, requireRole('admin'), policyController.updatePolicy);

module.exports = router;
