const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(requireAuth);

// Tenant routes
router.post('/tenant/complaints', requireRole('tenant'), complaintController.submitComplaint);
router.get('/tenant/complaints/my', requireRole('tenant'), complaintController.getMyComplaints);
router.get('/tenant/complaints/:id', requireRole('tenant', 'landlord'), complaintController.getComplaintById);

// Landlord routes
router.get('/landlord/complaints', requireRole('landlord'), complaintController.getLandlordComplaints);
router.get('/landlord/complaints/:id', requireRole('landlord'), complaintController.getComplaintById);
router.put('/landlord/complaints/:id/status', requireRole('landlord'), complaintController.updateComplaintStatus);

module.exports = router;
