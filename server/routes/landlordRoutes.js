const express = require('express');
const router = express.Router();
const landlordController = require('../controllers/landlordController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Landlord property routes
router.post('/properties', requireAuth, requireRole('landlord'), landlordController.createProperty);
router.get('/properties', requireAuth, requireRole('landlord'), landlordController.getMyProperties);
router.get('/properties/:id', requireAuth, requireRole('landlord'), landlordController.getMyPropertyById);
router.put('/properties/:id', requireAuth, requireRole('landlord'), landlordController.updateProperty);
router.delete('/properties/:id', requireAuth, requireRole('landlord'), landlordController.deleteProperty);

// Landlord uploads
router.post('/properties/:id/images', requireAuth, requireRole('landlord'), landlordController.uploadImage);
router.post('/properties/:id/documents', requireAuth, requireRole('landlord'), landlordController.uploadDocument);

// Landlord application reviews
router.get('/applications', requireAuth, requireRole('landlord'), landlordController.getTenantApplications);
router.get('/applications/:id', requireAuth, requireRole('landlord'), landlordController.getTenantApplicationById);
router.put('/applications/:id/status', requireAuth, requireRole('landlord'), landlordController.updateApplicationStatus);

module.exports = router;
