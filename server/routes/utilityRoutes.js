const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(requireAuth);

router.post('/', requireRole('landlord'), utilityController.createUtilityRecord);
router.get('/', requireRole('landlord'), utilityController.getLandlordUtilities);
router.get('/my', requireRole('tenant'), utilityController.getTenantUtilities);

module.exports = router;
