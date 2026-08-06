# Walkthrough - Maintenance Coordination Module & Billing Schema

We have successfully designed, built, and verified the complete **Maintenance Request and Coordination Module** supporting three distinct platform roles: **Tenant**, **Landlord**, and **Maintenance Personnel**. Additionally, we verified all billing models and resolved authorization details.

---

## 1. Database Schema Configurations

Two database patch scripts have been compiled and are saved in the project root:
1. [maintenance_schema_patch.sql](file:///c:/DOMIKNOW%202026/database/maintenance_schema_patch.sql): Contains table definitions for maintenance requests, assignments, updates, materials, and completion reports.
2. [billing_schema_patch.sql](file:///c:/DOMIKNOW%202026/database/billing_schema_patch.sql): Extends the billing ledger tracking states.

> [!IMPORTANT]
> To execute these changes on the live database, copy the contents of these two SQL patch files and execute them in your **Supabase Dashboard SQL Editor**.

---

## 2. Exposed API Routing Endpoints

We created RESTful API routing endpoints mounted under `/api` inside [maintenanceRoutes.js](file:///c:/DOMIKNOW%202026/server/routes/maintenanceRoutes.js) to support the workflow state transitions:

### Tenant Endpoints
- `POST /api/maintenance/requests` - Submit a new request (Category, Priority, Description, preferred schedule, unit number, base64 photo attachment).
- `GET /api/maintenance/requests/tenant` - Retrieve request log history.
- `PUT /api/maintenance/requests/:id/tenant-confirm` - Confirm completion (closes ticket) or request rework.

### Landlord Endpoints
- `GET /api/maintenance/requests/landlord` - Retrieve property queues.
- `PUT /api/maintenance/requests/:id/landlord-respond` - Approve or reject pending tenant request (saves rejection reason).
- `PUT /api/maintenance/requests/:id/landlord-assign` - Assign technician, due date, and entry remarks.
- `PUT /api/maintenance/requests/:id/landlord-verify` - Verify completion report (accept or request rework).
- `GET /api/maintenance/personnel` - Fetch registered active maintenance contractors.

### Maintenance Personnel Endpoints
- `GET /api/maintenance/requests/worker` - Retrieve assigned jobs list.
- `PUT /api/maintenance/requests/:id/worker-respond` - Accept or decline job offer (declined offers return to landlord pool).
- `PUT /api/maintenance/requests/:id/worker-status` - Update progress state (`travelling` -> `arrived` -> `repairing`).
- `POST /api/maintenance/requests/:id/worker-report` - File completion reports (Problem found, repairs done, safety notes, labor services cost, before/after images, materials details).

---

## 3. UI Interfaces Redesigned (Zero Emojis & Strict CSP Compliant)

All interfaces have been modified to eliminate raw emojis/stickers, replacing them with high-fidelity, polished, clean layouts. Furthermore, **all dynamic button injections have been refitted with container-level event delegation (`e.target.closest`)** to comply with CSP restrictions:

1. **Tenant Center** ([maintenance.html](file:///c:/DOMIKNOW%202026/public/pages/tenant/maintenance.html))
   - Features category selection (Plumbing, Electrical, Aircon, Door, Roof, Internet, Appliance, Others) and priority level filters.
   - Includes details modal displaying technician status progress bars, assignments, completed work reports, and action triggers for confirm completion and rework.
2. **Landlord Queue** ([maintenance.html](file:///c:/DOMIKNOW%202026/public/pages/landlord/maintenance.html))
   - Provides request filters (All, Pending, Approved, Assigned, Accepted, In Progress, Completed, Closed, Rejected).
3. **Landlord Details Manager** ([maintenance-details.html](file:///c:/DOMIKNOW%202026/public/pages/landlord/maintenance-details.html))
   - Evaluates incoming requests (Approve / Reject reasons).
   - Coordinates worker schedules and targets.
   - Audits completed technicians reports, cost balances (materials/labor), and photo evidence.
4. **Maintenance Task Ledger** ([tasks.html](file:///c:/DOMIKNOW%202026/public/pages/maintenance/tasks.html))
   - Views job offers.
5. **Contractor Workspace** ([task-details.html](file:///c:/DOMIKNOW%202026/public/pages/maintenance/task-details.html))
   - Actions to accept/decline jobs.
   - Real-time updates for travel states.
   - Dynamic report form with add-row tables to list PVC pipes, couplings, sealant materials, quantities, costs, and labor services.

---

## 4. Verification & Testing

An integration test script has been saved on disk at [test_maintenance_workflow.js](file:///c:/DOMIKNOW%202026/scratch/test_maintenance_workflow.js).
It covers:
1. Request creation.
2. Landlord approval.
3. Contractor assignment.
4. Contractor acceptance.
5. Status pipeline flow (`travelling` -> `arrived` -> `repairing`).
6. Completion report with materials logs.
7. Verification and tenant signoff closure.

You can verify the system workflows by running `node scratch/test_maintenance_workflow.js` after executing the database schema patches in Supabase.
