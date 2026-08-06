const express = require('express');
const router = express.Router();
const tenantAppController = require('../controllers/tenantAppController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Tenant application workflows
router.post('/', requireAuth, requireRole('tenant'), tenantAppController.createApplication);
router.post('/:id/documents', requireAuth, requireRole('tenant'), tenantAppController.uploadDocument);
router.get('/my', requireAuth, requireRole('tenant'), tenantAppController.getMyApplications);
router.get('/:id', requireAuth, requireRole('tenant'), tenantAppController.getApplicationById);

module.exports = router;
