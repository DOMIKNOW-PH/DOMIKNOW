const express = require('express');
const router = express.Router();
const landlordRatingController = require('../controllers/landlordRatingController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(requireAuth);

// Tenant routes
router.get('/tenant/landlord-ratings/eligible', requireRole('tenant'), landlordRatingController.getEligibleLeases);
router.get('/tenant/landlord-ratings/my', requireRole('tenant'), landlordRatingController.getMyLandlordRatings);
router.get('/tenant/landlord-ratings/:id', requireRole('tenant'), landlordRatingController.getLandlordRatingById);
router.post('/tenant/landlord-ratings', requireRole('tenant'), landlordRatingController.submitLandlordRating);
router.put('/tenant/landlord-ratings/:id', requireRole('tenant'), landlordRatingController.editLandlordRating);

// Landlord routes
router.get('/landlord/landlord-ratings', requireRole('landlord'), landlordRatingController.getLandlordReceivedRatings);

module.exports = router;
