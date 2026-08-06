const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(requireAuth);

router.post('/', requireRole('tenant'), paymentController.submitPayment);
router.get('/my', requireRole('tenant'), paymentController.getTenantPayments);
router.get('/', requireRole('landlord'), paymentController.getLandlordPayments);
router.put('/:id/verify', requireRole('landlord'), paymentController.verifyPayment);

module.exports = router;
