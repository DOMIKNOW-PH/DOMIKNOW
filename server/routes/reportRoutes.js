const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const tenantReportController = require('../controllers/tenantReportController');
const landlordReportController = require('../controllers/landlordReportController');
const requireAuth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.use(requireAuth);

// Reports
router.post('/reports', requireRole('tenant', 'landlord', 'maintenance'), reportController.submitReport);
router.get('/reports/my', requireRole('tenant', 'landlord', 'maintenance'), reportController.getMyReports);
router.get('/admin/reports', requireRole('admin'), reportController.getAdminReports);
router.put('/admin/reports/:id/status', requireRole('admin'), reportController.updateReportStatus);

// Disputes
router.post('/disputes', requireRole('tenant', 'landlord'), reportController.submitDispute);
router.get('/disputes/my', requireRole('tenant', 'landlord'), reportController.getMyDisputes);
router.get('/admin/disputes', requireRole('admin'), reportController.getAdminDisputes);
router.put('/admin/disputes/:id/status', requireRole('admin'), reportController.updateDisputeStatus);

// Policy Violations
router.post('/policy-violations', requireRole('tenant', 'landlord'), reportController.submitPolicyViolation);
router.get('/policy-violations/my', requireRole('tenant', 'landlord'), reportController.getMyPolicyViolations);
router.get('/admin/policy-violations', requireRole('admin'), reportController.getAdminPolicyViolations);
router.put('/admin/policy-violations/:id/status', requireRole('admin'), reportController.updatePolicyViolationStatus);

// ─── Tenant Reports (Landlord Reports a Tenant) ───────────────────────────────
// Landlord routes
router.post('/tenant-reports',                                requireRole('landlord'), tenantReportController.submitTenantReport);
router.get('/tenant-reports/my-filed',                        requireRole('landlord'), tenantReportController.getLandlordTenantReports);
router.get('/tenant-reports/:id/detail-landlord',            requireRole('landlord'), tenantReportController.getTenantReportDetailForLandlord);
router.post('/tenant-reports/:id/additional-evidence',        requireRole('landlord'), tenantReportController.addAdditionalEvidence);

// Tenant routes
router.get('/tenant-reports/against-me',                      requireRole('tenant'),   tenantReportController.getMyReportsAgainstMe);
router.get('/tenant-reports/:id/detail-tenant',               requireRole('tenant'),   tenantReportController.getTenantReportDetailForTenant);
router.put('/tenant-reports/:id/explain',                     requireRole('tenant'),   tenantReportController.submitExplanation);

// Admin routes
router.get('/admin/tenant-reports',                           requireRole('admin'),    tenantReportController.getAllTenantReports);
router.get('/admin/tenant-reports/:id',                       requireRole('admin'),    tenantReportController.getTenantReportDetails);
router.put('/admin/tenant-reports/:id/decision',              requireRole('admin'),    tenantReportController.adminDecision);

// ─── Landlord Reports (Tenant Reports a Landlord) ─────────────────────────────
// Tenant routes
router.post('/landlord-reports',                              requireRole('tenant'),   landlordReportController.submitLandlordReport);
router.get('/landlord-reports/my-filed',                      requireRole('tenant'),   landlordReportController.getTenantFiledLandlordReports);
router.get('/landlord-reports/:id/detail-filed',             requireRole('tenant'),   landlordReportController.getTenantFiledReportDetail);
router.post('/landlord-reports/:id/additional-evidence',      requireRole('tenant'),   landlordReportController.submitAdditionalEvidence);

// Landlord routes
router.get('/landlord-reports/against-me',                    requireRole('landlord'), landlordReportController.getReportsAgainstMe);
router.get('/landlord-reports/:id/detail-landlord',             requireRole('landlord'), landlordReportController.getLandlordReportDetailForLandlord);
router.put('/landlord-reports/:id/explain',                   requireRole('landlord'), landlordReportController.submitLandlordExplanation);

// Admin routes
router.get('/admin/landlord-reports',                         requireRole('admin'),    landlordReportController.getAllLandlordReports);
router.get('/admin/landlord-reports/:id',                     requireRole('admin'),    landlordReportController.getLandlordReportDetailForAdmin);
router.put('/admin/landlord-reports/:id/decision',            requireRole('admin'),    landlordReportController.processAdminDecision);

// ─── Investigation Discussion Thread Routes ────────────────────────────────────
router.get('/reports/messages/:type/:id',  requireRole('admin', 'landlord', 'tenant'), reportController.getInvestigationMessages);
router.post('/reports/messages/:type/:id', requireRole('admin', 'landlord', 'tenant'), reportController.postInvestigationMessage);

module.exports = router;
