const tenantReportModel = require('../models/tenantReportModel');
const auditLogModel     = require('../models/auditLogModel');
const responseHelper    = require('../utils/responseHelper');
const { uploadFile, getSignedUrl } = require('../utils/storageHelper');

const BUCKET = 'tenant-report-evidence';

// Allowed MIME types for evidence (photos, PDFs, videos, documents)
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    'text/plain'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file (video support)

// ─── Helper: Attach fresh signed URLs to a list of evidence records ──────────
async function attachEvidenceUrls(evidenceList) {
    for (const ev of evidenceList) {
        if (ev.file_path) {
            try {
                ev.file_url = await getSignedUrl(BUCKET, ev.file_path);
            } catch (err) {
                console.error('Error refreshing signed URL for evidence:', err);
            }
        }
    }
    return evidenceList;
}

// ─── Helper: Upload an array of base64 file objects ──────────────────────────
async function uploadEvidenceFiles(files, uploaderId) {
    const uploaded = [];
    for (const f of files) {
        const { base64_content, file_name, mime_type, file_size } = f;

        if (!ALLOWED_MIME_TYPES.includes(mime_type)) {
            throw new Error(`Unsupported file type: ${mime_type}. Allowed: images, PDFs, videos.`);
        }
        if (parseInt(file_size) > MAX_FILE_SIZE) {
            throw new Error(`File "${file_name}" exceeds the 50 MB size limit.`);
        }

        const uniqueName   = `${Date.now()}-${file_name}`;
        const storagePath  = `tenant-reports/${uploaderId}/${uniqueName}`;
        const uploadResult = await uploadFile(BUCKET, storagePath, base64_content, mime_type);

        uploaded.push({
            file_name: file_name,
            file_url:  uploadResult.url,
            file_path: uploadResult.path,
            file_type: mime_type,
            file_size: parseInt(file_size) || null
        });
    }
    return uploaded;
}

// =============================================================================
// LANDLORD ENDPOINTS
// =============================================================================

const tenantReportController = {

    /**
     * POST /api/tenant-reports
     * Landlord files a report against a tenant.
     * Body: { lease_id, report_category, incident_date, incident_description, severity, files[] }
     */
    async submitTenantReport(req, res) {
        try {
            const landlordId = req.user.id;
            const {
                lease_id,
                report_category,
                incident_date,
                incident_description,
                severity,
                files // Array of { base64_content, file_name, mime_type, file_size }
            } = req.body;

            // ── Field validation
            if (!lease_id || !report_category || !incident_date || !incident_description || !severity) {
                return responseHelper.error(res, 'Lease, report category, incident date, description, and severity are required.');
            }

            const allowedCategories = [
                'non_payment','property_damage','house_rule_violation','noise_complaint',
                'illegal_activity','unauthorized_occupants','harassment',
                'unsanitary_behavior','utility_abuse','other'
            ];
            if (!allowedCategories.includes(report_category)) {
                return responseHelper.error(res, 'Invalid report category.');
            }

            const allowedSeverities = ['minor', 'moderate', 'major', 'critical'];
            if (!allowedSeverities.includes(severity)) {
                return responseHelper.error(res, 'Invalid severity. Allowed: minor, moderate, major, critical.');
            }

            // ── Verify landlord–tenant lease relationship
            const lease = await tenantReportModel.getLeaseSummary(lease_id, landlordId);
            if (!lease) {
                return responseHelper.error(res, 'You are not authorized to report this tenant. No matching lease found under your account.', null, 403);
            }

            // ── Evidence requirement: at least 1 file required
            //    Exception: "other" category may proceed with text-only if explicitly noted
            if (!files || !Array.isArray(files) || files.length === 0) {
                if (report_category !== 'other') {
                    return responseHelper.error(res, 'At least one evidence file is required to submit a report.');
                }
                // For "other" without files, description must be detailed (min 50 chars)
                if (incident_description.trim().length < 50) {
                    return responseHelper.error(res, 'For reports without evidence, the incident description must be at least 50 characters long.');
                }
            }

            // ── Upload evidence files
            let uploadedFiles = [];
            if (files && files.length > 0) {
                try {
                    uploadedFiles = await uploadEvidenceFiles(files, landlordId);
                } catch (uploadErr) {
                    return responseHelper.error(res, uploadErr.message || 'Evidence upload failed.');
                }
            }

            // ── Create the report
            const report = await tenantReportModel.createTenantReport({
                landlord_id:          landlordId,
                tenant_id:            lease.tenant_id,
                lease_id:             lease_id,
                property_id:          lease.property_id,
                report_category,
                incident_date,
                incident_description,
                severity
            });

            // ── Insert evidence records
            if (uploadedFiles.length > 0) {
                await tenantReportModel.addEvidence(report.id, uploadedFiles);
            }

            // ── Audit log
            await auditLogModel.log(
                landlordId,
                'SUBMIT_TENANT_REPORT',
                `Landlord filed tenant report ${report.id} (Category: ${report_category}, Severity: ${severity}) against tenant ${lease.tenant_id}`
            );

            return responseHelper.success(res, 'Tenant report submitted successfully. It is now pending admin review.', report, 201);

        } catch (error) {
            console.error('submitTenantReport error:', error);
            return responseHelper.error(res, 'Failed to submit tenant report.', error, 500);
        }
    },

    /**
     * GET /api/tenant-reports/my-filed
     * Landlord views all reports they have filed.
     */
    async getLandlordTenantReports(req, res) {
        try {
            const reports = await tenantReportModel.findReportsByLandlordId(req.user.id);
            return responseHelper.success(res, 'Landlord tenant reports retrieved.', reports);
        } catch (error) {
            console.error('getLandlordTenantReports error:', error);
            return responseHelper.error(res, 'Failed to retrieve tenant reports.', error, 500);
        }
    },

    /**
     * GET /api/tenant-reports/:id/detail-landlord
     * Landlord views full detail of one report they filed.
     */
    async getTenantReportDetailForLandlord(req, res) {
        try {
            const landlordId = req.user.id;
            const { id } = req.params;

            const report = await tenantReportModel.findTenantReportById(id);
            if (!report || report.landlord_id !== landlordId) {
                return responseHelper.error(res, 'Report not found or access denied.', null, 404);
            }

            let evidence = await tenantReportModel.findEvidenceByReportId(id);
            evidence = await attachEvidenceUrls(evidence);

            return responseHelper.success(res, 'Report details retrieved.', { ...report, evidence });

        } catch (error) {
            console.error('getTenantReportDetailForLandlord error:', error);
            return responseHelper.error(res, 'Failed to get report details.', error, 500);
        }
    },

    /**
     * POST /api/tenant-reports/:id/additional-evidence
     * Landlord adds more evidence after admin requested it.
     */
    async addAdditionalEvidence(req, res) {
        try {
            const landlordId = req.user.id;
            const { id } = req.params;
            const { files } = req.body;

            if (!files || !Array.isArray(files) || files.length === 0) {
                return responseHelper.error(res, 'At least one evidence file is required.');
            }

            let uploadedFiles;
            try {
                uploadedFiles = await uploadEvidenceFiles(files, landlordId);
            } catch (uploadErr) {
                return responseHelper.error(res, uploadErr.message || 'Evidence upload failed.');
            }

            const result = await tenantReportModel.addAdditionalEvidence(id, landlordId, uploadedFiles);

            if (result.error) {
                return responseHelper.error(res, result.error, null, 400);
            }

            await auditLogModel.log(
                landlordId,
                'ADD_ADDITIONAL_EVIDENCE',
                `Landlord added ${uploadedFiles.length} additional evidence file(s) to tenant report ${id}. Status reset to pending_admin_review.`
            );

            return responseHelper.success(res, 'Additional evidence submitted. Report is now back under admin review.', result.data);

        } catch (error) {
            console.error('addAdditionalEvidence error:', error);
            return responseHelper.error(res, 'Failed to add additional evidence.', error, 500);
        }
    },

    // =============================================================================
    // TENANT ENDPOINTS
    // =============================================================================

    /**
     * GET /api/tenant-reports/against-me
     * Tenant views all reports filed against them.
     */
    async getMyReportsAgainstMe(req, res) {
        try {
            const reports = await tenantReportModel.findReportsByTenantId(req.user.id);
            return responseHelper.success(res, 'Reports against you retrieved.', reports);
        } catch (error) {
            console.error('getMyReportsAgainstMe error:', error);
            return responseHelper.error(res, 'Failed to retrieve reports against you.', error, 500);
        }
    },

    /**
     * GET /api/tenant-reports/:id/detail-tenant
     * Tenant views full detail of one report against them (evidence shown if approved/rejected).
     */
    async getTenantReportDetailForTenant(req, res) {
        try {
            const tenantId = req.user.id;
            const { id } = req.params;

            const report = await tenantReportModel.findTenantReportById(id);
            if (!report || report.tenant_id !== tenantId) {
                return responseHelper.error(res, 'Report not found or access denied.', null, 404);
            }

            // Only show evidence if report is no longer pending
            let evidence = [];
            if (report.status !== 'pending_admin_review') {
                evidence = await tenantReportModel.findEvidenceByReportId(id);
                evidence = await attachEvidenceUrls(evidence);
            }

            return responseHelper.success(res, 'Report details retrieved.', { ...report, evidence });

        } catch (error) {
            console.error('getTenantReportDetailForTenant error:', error);
            return responseHelper.error(res, 'Failed to get report details.', error, 500);
        }
    },

    /**
     * PUT /api/tenant-reports/:id/explain
     * Tenant submits their side of the story while report is still pending.
     */
    async submitExplanation(req, res) {
        try {
            const tenantId = req.user.id;
            const { id } = req.params;
            const { explanation } = req.body;

            if (!explanation || explanation.trim().length < 10) {
                return responseHelper.error(res, 'Explanation must be at least 10 characters.');
            }

            const result = await tenantReportModel.submitTenantExplanation(id, tenantId, explanation.trim());

            if (result.error) {
                return responseHelper.error(res, result.error, null, 400);
            }

            await auditLogModel.log(
                tenantId,
                'TENANT_SUBMIT_EXPLANATION',
                `Tenant submitted explanation for report ${id}`
            );

            return responseHelper.success(res, 'Your explanation has been submitted successfully.', result.data);

        } catch (error) {
            console.error('submitExplanation error:', error);
            return responseHelper.error(res, 'Failed to submit explanation.', error, 500);
        }
    },

    // =============================================================================
    // ADMIN ENDPOINTS
    // =============================================================================

    /**
     * GET /api/admin/tenant-reports
     * Admin views all tenant reports with optional filters.
     */
    async getAllTenantReports(req, res) {
        try {
            const reports = await tenantReportModel.findAllTenantReports();
            return responseHelper.success(res, 'All tenant reports retrieved.', reports);
        } catch (error) {
            console.error('getAllTenantReports error:', error);
            return responseHelper.error(res, 'Failed to retrieve tenant reports.', error, 500);
        }
    },

    /**
     * GET /api/admin/tenant-reports/:id
     * Admin views full detail of a single report (all parties + evidence + previous history).
     */
    async getTenantReportDetails(req, res) {
        try {
            const { id } = req.params;

            const report = await tenantReportModel.findTenantReportById(id);
            if (!report) {
                return responseHelper.error(res, 'Report not found.', null, 404);
            }

            // Fetch evidence with fresh signed URLs
            let evidence = await tenantReportModel.findEvidenceByReportId(id);
            evidence = await attachEvidenceUrls(evidence);

            // Fetch previous reports against this tenant (for context)
            const previousReports = await tenantReportModel.getPreviousReportsAgainstTenant(report.tenant_id, id);

            return responseHelper.success(res, 'Tenant report details retrieved.', {
                ...report,
                evidence,
                previous_reports: previousReports
            });

        } catch (error) {
            console.error('getTenantReportDetails error:', error);
            return responseHelper.error(res, 'Failed to get report details.', error, 500);
        }
    },

    /**
     * PUT /api/admin/tenant-reports/:id/decision
     * Admin makes a decision: approve, reject, or needs_more_evidence.
     */
    async adminDecision(req, res) {
        try {
            const adminId = req.user.id;
            const { id } = req.params;
            const { status, admin_remarks } = req.body;

            const allowed = ['approved', 'rejected', 'needs_more_evidence'];
            if (!allowed.includes(status)) {
                return responseHelper.error(res, `Invalid decision. Allowed: ${allowed.join(', ')}.`);
            }

            // Require remarks for rejection
            if (status === 'rejected' && (!admin_remarks || admin_remarks.trim().length < 5)) {
                return responseHelper.error(res, 'A reason/remarks are required when rejecting a report.');
            }
            // Require remarks for requesting more evidence
            if (status === 'needs_more_evidence' && (!admin_remarks || admin_remarks.trim().length < 5)) {
                return responseHelper.error(res, 'Please specify what additional evidence is needed.');
            }

            const updated = await tenantReportModel.updateTenantReportStatus(id, {
                status,
                admin_remarks: admin_remarks?.trim() || null,
                admin_id: adminId
            });

            const actionLabel = {
                approved:            'APPROVE_TENANT_REPORT',
                rejected:            'REJECT_TENANT_REPORT',
                needs_more_evidence: 'REQUEST_MORE_EVIDENCE_TENANT_REPORT'
            }[status];

            await auditLogModel.log(
                adminId,
                actionLabel,
                `Admin set tenant report ${id} to "${status}". Remarks: ${admin_remarks || 'none'}`
            );

            const messages = {
                approved:            'Report approved. Tenant record and trust score updated.',
                rejected:            'Report rejected. Landlord and tenant will be notified.',
                needs_more_evidence: 'Admin has requested additional evidence from the landlord.'
            };

            return responseHelper.success(res, messages[status], updated);

        } catch (error) {
            console.error('adminDecision error:', error);
            return responseHelper.error(res, 'Failed to process admin decision.', error, 500);
        }
    }
};

module.exports = tenantReportController;
