const express = require('express');
const router = express.Router();
const propertyRatingController = require('../controllers/propertyRatingController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(requireAuth);

// Tenant routes
router.get('/tenant/property-ratings/eligible', requireRole('tenant'), propertyRatingController.getEligibleLeases);
router.get('/tenant/property-ratings/my', requireRole('tenant'), propertyRatingController.getMyPropertyRatings);
router.get('/tenant/property-ratings/:id', requireRole('tenant'), propertyRatingController.getPropertyRatingById);
router.post('/tenant/property-ratings', requireRole('tenant'), propertyRatingController.submitPropertyRating);
router.put('/tenant/property-ratings/:id', requireRole('tenant'), propertyRatingController.editPropertyRating);

// Landlord routes
router.get('/landlord/property-ratings', requireRole('landlord'), propertyRatingController.getLandlordPropertyRatings);

module.exports = router;
