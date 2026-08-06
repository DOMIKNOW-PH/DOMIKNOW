const express = require('express');
const router = express.Router();
const ratingsController = require('../controllers/ratingsController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(requireAuth);

// Tenant routes
router.get('/tenant/ratings/eligible', requireRole('tenant'), ratingsController.getEligibleLeases);
router.get('/tenant/ratings/my', requireRole('tenant'), ratingsController.getMyRatings);
router.get('/tenant/ratings/:id', requireRole('tenant'), ratingsController.getRatingById);
router.post('/tenant/ratings', requireRole('tenant'), ratingsController.submitRating);
router.put('/tenant/ratings/:id', requireRole('tenant'), ratingsController.editRating);

// Landlord routes
router.get('/landlord/ratings', requireRole('landlord'), ratingsController.getLandlordRatings);

module.exports = router;
