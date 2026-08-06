const express = require('express');
const router = express.Router();
const adminMonitorController = require('../controllers/adminMonitorController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

// All routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole('admin'));

router.get('/screenings', adminMonitorController.getAllScreenings);
router.get('/screening', adminMonitorController.getAllScreenings);

router.get('/leases', adminMonitorController.getAllLeases);
router.get('/lease', adminMonitorController.getAllLeases);

router.get('/billings', adminMonitorController.getAllBillings);
router.get('/billing', adminMonitorController.getAllBillings);

router.get('/payments', adminMonitorController.getAllPayments);
router.get('/payment', adminMonitorController.getAllPayments);

router.get('/audit-logs', adminMonitorController.getAuditLogs);
router.get('/audit-log', adminMonitorController.getAuditLogs);

module.exports = router;
