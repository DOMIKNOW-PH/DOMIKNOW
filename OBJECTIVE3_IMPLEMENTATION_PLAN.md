# OBJECTIVE 3: PROPERTY REGISTRATION & TENANT APPLICATIONS
## Implementation Plan

**Status:** 🚧 IN PROGRESS  
**Date Started:** July 26, 2026  
**Backend Status:** ✅ 100% Complete  
**Frontend Status:** 🚧 40% Complete  

---

## OVERVIEW

Objective 3 implements the complete workflow for:
- **Landlords:** Register properties, upload images/documents, manage tenant applications
- **Tenants:** Apply for properties, upload required documents, track application status
- **Admins:** Review property submissions, approve/reject properties

---

## BACKEND IMPLEMENTATION STATUS ✅ COMPLETE

### Routes Implemented
1. **Landlord Routes** (`/api/landlord/...`)
   - ✅ POST `/properties` - Register new property
   - ✅ GET `/properties` - Get landlord's properties
   - ✅ GET `/properties/:id` - Get property details
   - ✅ PUT `/properties/:id` - Update property
   - ✅ POST `/properties/:id/images` - Upload property image
   - ✅ POST `/properties/:id/documents` - Upload property document
   - ✅ GET `/applications` - Get tenant applications for landlord's properties
   - ✅ GET `/applications/:id` - Get application details
   - ✅ PUT `/applications/:id/status` - Approve/reject application

2. **Tenant Routes** (`/api/tenant/applications/...`)
   - ✅ POST `/` - Submit rental application
   - ✅ POST `/:id/documents` - Upload application document
   - ✅ GET `/my` - Get tenant's applications
   - ✅ GET `/:id` - Get application details

3. **Admin Routes** (`/api/admin/...`)
   - ✅ GET `/properties/review` - Get properties pending review
   - ✅ GET `/properties/:id/review` - Get property review details
   - ✅ PUT `/properties/:id/approve` - Approve property
   - ✅ PUT `/properties/:id/reject` - Reject property with reason

### Controllers Implemented
- ✅ `landlordController.js` - All property and application management logic
- ✅ `tenantAppController.js` - Tenant application submission and tracking
- ✅ `adminReviewController.js` - Admin property review workflow

### Models Implemented
- ✅ `landlordModel.js` - Property CRUD, uploads, application queries
- ✅ `tenantAppModel.js` - Application CRUD and document storage
- ✅ `adminModel.js` - Property review queries

### Database Tables
- ✅ `properties` table (enhanced with admin review fields)
- ✅ `property_images` table
- ✅ `property_documents` table
- ✅ `tenant_applications` table
- ✅ `tenant_application_documents` table

### Features
- ✅ Base64 file upload support
- ✅ Supabase Storage integration
- ✅ Signed URL generation for secure file access
- ✅ Document type validation
- ✅ File size limits (5MB images, 10MB documents)
- ✅ Duplicate application prevention
- ✅ Minimum document requirements for approval
- ✅ Audit logging for all actions

---

## FRONTEND IMPLEMENTATION STATUS 🚧 40% COMPLETE

### Landlord Pages

#### 1. Property Registration ✅ COMPLETE
**File:** `public/pages/landlord/property-create.html`
- ✅ Multi-step registration form
- ✅ Property details input (name, type, rent, occupants)
- ✅ Location selection (barangay dropdown, lat/lng)
- ✅ Amenity checkboxes (11 options)
- ✅ House rules text area
- ✅ Form submission to API
- ✅ Success feedback and redirect
- ✅ Client-side validation

#### 2. Property List ✅ COMPLETE
**File:** `public/pages/landlord/properties.html`
- ✅ Grid display of all landlord properties
- ✅ Property cards with image, status badge, stats
- ✅ Rejection reason display
- ✅ Status-based action buttons
- ✅ Edit button for pending/rejected properties
- ✅ View details button for all properties
- ✅ Empty state with call-to-action
- ✅ Responsive grid layout

#### 3. Property Details ⚠️ PARTIALLY COMPLETE
**File:** `public/pages/landlord/property-details.html`
**Completed:**
- ✅ View mode showing all property information
- ✅ Status badge display
- ✅ Rejection reason alert
- ✅ Edit mode with form
- ✅ Property update functionality
- ✅ GIS map display with marker
- ✅ Image gallery display
- ✅ Image upload with base64 conversion
- ✅ Document list display
- ✅ Document upload with base64 conversion
- ✅ File type and size validation

**Needs Completion:**
- ❌ File truncated in provided context - verify full implementation
- ❌ Test all upload functionality
- ❌ Verify signed URL generation for documents

#### 4. Tenant Applications List ❌ NOT STARTED
**File:** `public/pages/landlord/applications.html`
**Needs Implementation:**
- ❌ Fetch applications from `/api/landlord/applications`
- ❌ Display applications table with tenant info
- ❌ Status badges (pending/approved/rejected)
- ❌ Filter by status dropdown
- ❌ Search by tenant name
- ❌ View details button
- ❌ Application date display
- ❌ Property name display
- ❌ Empty state

#### 5. Application Details (Landlord) ❌ NOT STARTED
**File:** `public/pages/landlord/application-details.html`
**Needs Implementation:**
- ❌ Fetch application details from `/api/landlord/applications/:id`
- ❌ Display tenant information
- ❌ Display property information
- ❌ Display application message
- ❌ Display desired move-in date
- ❌ Display uploaded tenant documents (with download)
- ❌ Document preview/download functionality
- ❌ Approve button with confirmation
- ❌ Reject button with remarks textarea
- ❌ Status update functionality
- ❌ Application timeline display

### Tenant Pages

#### 6. Property Application Submission ❌ NOT STARTED
**File:** `public/pages/tenant/apply.html`
**Needs Implementation:**
- ❌ Get property_id from URL parameter
- ❌ Fetch and display property information
- ❌ Application form (message, move-in date)
- ❌ Submit application to `/api/tenant/applications`
- ❌ Document upload section
- ❌ Document type dropdown (valid_id, proof_of_income, etc.)
- ❌ Multiple document upload support
- ❌ Base64 file conversion
- ❌ Upload progress feedback
- ❌ Success message and redirect
- ❌ Duplicate application prevention

#### 7. Applications List (Tenant) ❌ NOT STARTED
**File:** `public/pages/tenant/applications.html`
**Needs Implementation:**
- ❌ Fetch applications from `/api/tenant/applications/my`
- ❌ Display applications table
- ❌ Property name and image
- ❌ Application status badges
- ❌ Submission date
- ❌ Landlord remarks (if any)
- ❌ View details button
- ❌ Filter by status
- ❌ Empty state

#### 8. Application Details (Tenant) ❌ NOT STARTED
**File:** `public/pages/tenant/application-details.html`
**Needs Implementation:**
- ❌ Fetch details from `/api/tenant/applications/:id`
- ❌ Display property information
- ❌ Display application status
- ❌ Display submitted information
- ❌ Display uploaded documents
- ❌ Landlord remarks display (if approved/rejected)
- ❌ Application timeline
- ❌ Upload additional documents (if status is pending)
- ❌ Cancel application button (if pending)

### Admin Pages

#### 9. Property Review Queue ❌ NOT STARTED
**File:** `public/pages/admin/property-review.html`
**Needs Implementation:**
- ❌ Fetch properties from `/api/admin/properties/review`
- ❌ Display properties table
- ❌ Landlord name display
- ❌ Property name and type
- ❌ Submission date
- ❌ Document count badge
- ❌ Image count badge
- ❌ Review button
- ❌ Filter by barangay
- ❌ Sort by submission date
- ❌ Empty state

#### 10. Property Review Details ❌ NOT STARTED
**File:** `public/pages/admin/property-review-details.html`
**Needs Implementation:**
- ❌ Fetch details from `/api/admin/properties/:id/review`
- ❌ Display all property information
- ❌ Display landlord information
- ❌ Image gallery viewer
- ❌ Document list with download/preview
- ❌ Document type verification checklist
- ❌ Minimum requirements check display
- ❌ Approve button
- ❌ Reject button with reason textarea
- ❌ Required documents indicator
- ❌ Confirmation modals

---

## IMPLEMENTATION PRIORITY

### Phase 1: Complete Landlord Flow ⚠️ IN PROGRESS
1. ✅ Property registration - DONE
2. ✅ Property list - DONE
3. ⚠️ Property details - VERIFY COMPLETION
4. ❌ Landlord applications list - START HERE
5. ❌ Landlord application details

### Phase 2: Implement Tenant Flow
6. ❌ Tenant application submission
7. ❌ Tenant applications list
8. ❌ Tenant application details

### Phase 3: Implement Admin Flow
9. ❌ Admin property review queue
10. ❌ Admin property review details

---

## KEY FEATURES TO IMPLEMENT

### Document Upload Pattern
All document uploads follow this pattern:
```javascript
// 1. Read file as base64
const file = input.files[0];
const reader = new FileReader();
reader.onload = async (e) => {
    const base64 = e.target.result.split(',')[1];
    
    // 2. Send to API
    const payload = {
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        document_type: selectedType,
        base64_content: base64
    };
    
    await fetch('/api/landlord/properties/:id/documents', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });
};
reader.readAsDataURL(file);
```

### Status Badge Styling
Use consistent status badges across all pages:
```html
<span class="status-badge status-pending">PENDING</span>
<span class="status-badge status-active">APPROVED</span>
<span class="status-badge status-rejected">REJECTED</span>
```

### Empty State Pattern
```html
<div class="empty-state">
    <span style="font-size: 3rem;">📋</span>
    <h3>No Applications Yet</h3>
    <p>Applications will appear here once tenants apply.</p>
</div>
```

---

## VALIDATION REQUIREMENTS

### Property Registration
- Property name: required, max 255 chars
- Monthly rent: required, min ₱100
- Max occupants: required, min 1
- Address: required
- Barangay: required (dropdown selection)
- Latitude/Longitude: required, valid coordinates

### Property Documents (Landlord)
- **Minimum Requirements for Approval:**
  - Must have: Government Permit (barangay/business permit)
  - Must have: Ownership Proof OR Authorization Letter
- File types: PDF, JPG, JPEG, PNG
- Max size: 10MB per document

### Property Images (Landlord)
- File types: JPG, JPEG, PNG, WEBP
- Max size: 5MB per image
- At least 1 image recommended (not enforced)
- Mark one as main cover image

### Tenant Application
- Property must be approved
- Move-in date: required, future date
- Message: optional
- Cannot submit duplicate application for same property

### Tenant Documents
- File types: PDF, JPG, JPEG, PNG
- Max size: 10MB per document
- Recommended: valid_id, proof_of_income
- For students: student_id, parent_guardian_id

---

## SECURITY CONSIDERATIONS

### File Uploads
- ✅ File type validation (backend)
- ✅ File size limits enforced
- ✅ Files stored in Supabase Storage
- ✅ Signed URLs for secure access
- ✅ Access control (only owner can view documents)

### Authorization
- ✅ Landlord can only view/edit their properties
- ✅ Tenant can only view/edit their applications
- ✅ Admin can view all for review
- ✅ JWT authentication required for all actions

### Data Privacy
- ✅ Tenant documents only visible to landlord and admin
- ✅ Property documents only visible to landlord and admin
- ✅ Personal information protected

---

## TESTING CHECKLIST

### Landlord Workflow
- [ ] Register new property
- [ ] Upload property images
- [ ] Upload required documents
- [ ] Edit property details (pending/rejected only)
- [ ] View all my properties
- [ ] View property details
- [ ] View tenant applications
- [ ] View application documents
- [ ] Approve tenant application
- [ ] Reject tenant application with remarks

### Tenant Workflow
- [ ] Browse approved properties
- [ ] Submit rental application
- [ ] Upload required documents
- [ ] View my applications list
- [ ] View application details
- [ ] View application status
- [ ] View landlord remarks

### Admin Workflow
- [ ] View properties pending review
- [ ] View property review details
- [ ] View uploaded images
- [ ] Download/view property documents
- [ ] Check minimum requirements met
- [ ] Approve property
- [ ] Reject property with reason

---

## NEXT STEPS

1. **Verify property-details.html is complete** - Check if file was truncated
2. **Implement landlord applications list** - Show all applications for landlord's properties
3. **Implement landlord application details** - Show full application info with approve/reject
4. **Implement tenant apply page** - Application submission form
5. **Implement tenant applications list** - Show all tenant's applications
6. **Implement tenant application details** - Show application status and remarks
7. **Implement admin review queue** - Show all pending properties
8. **Implement admin review details** - Full review interface with approve/reject
9. **Test complete end-to-end workflow**
10. **Create completion report**

---

**Last Updated:** July 26, 2026  
**Status:** Ready to continue implementation  
**Next Task:** Complete landlord applications pages

