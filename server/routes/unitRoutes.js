const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Public route to view units under a property
router.get('/properties/:propertyId/units', unitController.getUnitsByProperty);

// Public route to view a specific unit details
router.get('/units/:id', unitController.getUnitById);

// Landlord / Admin routes for unit management
router.post('/properties/:propertyId/units', requireAuth, requireRole('landlord', 'admin'), unitController.createUnit);
router.put('/units/:id', requireAuth, requireRole('landlord', 'admin'), unitController.updateUnit);
router.post('/units/:id/images', requireAuth, requireRole('landlord', 'admin'), unitController.uploadUnitImage);
router.patch('/units/:id/status', requireAuth, requireRole('landlord', 'admin'), unitController.updateUnitStatus);
router.patch('/units/:unitId/beds/:bedId/status', requireAuth, requireRole('landlord', 'admin'), unitController.updateBedStatus);
router.delete('/units/:unitId/images/:imageId', requireAuth, requireRole('landlord', 'admin'), unitController.deleteUnitImage);
router.delete('/units/:id', requireAuth, requireRole('landlord', 'admin'), unitController.deleteUnit);

module.exports = router;
