const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// Tenant submit reservation (Tenant only)
router.post('/', requireAuth, requireRole('tenant'), reservationController.createReservation);

// Tenant view own reservations (Tenant only)
router.get('/my', requireAuth, requireRole('tenant'), reservationController.getTenantReservations);

// Admin view all reservations (Admin only)
router.get('/', requireAuth, requireRole('admin'), reservationController.getAllReservations);

// Admin manage reservation status (Admin only)
router.put('/:id/status', requireAuth, requireRole('admin'), reservationController.updateReservationStatus);

module.exports = router;
