const express = require('express');
const router = express.Router();
const screeningController = require('../controllers/screeningController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(requireAuth);

router.post('/', requireRole('tenant'), screeningController.createScreening);
router.get('/my', requireRole('tenant'), screeningController.getMyScreenings);
router.get('/', requireRole('landlord'), screeningController.getLandlordScreenings);
router.get('/:id', requireRole('landlord'), screeningController.getScreeningDetails);
router.put('/:id/score', requireRole('landlord'), screeningController.calculateScreeningScore);

module.exports = router;
