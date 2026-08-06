# Admin User Approval System - User Guide

## ✅ System Status: FULLY IMPLEMENTED & FUNCTIONAL

The admin user approval system is **100% complete and working**. This guide explains how it works.

---

## 📋 How User Registration & Approval Works

### Registration Flow

#### 1. **User Registers**
- User visits `/auth/register.html`
- Fills registration form:
  - Full Name
  - Email
  - Password
  - Role (Tenant/Landlord/Maintenance/Admin)
  - Contact Number
  - Address

#### 2. **Email Verification**
- System sends 6-digit verification code to email
- User enters code at `/auth/verify-code.html`
- Email is verified (`is_verified = true`)

#### 3. **Account Status Assignment**
Based on role selected during registration:

| Role | Initial Status | Requires Admin Approval? |
|------|----------------|--------------------------|
| **Tenant** | `active` | ❌ No - Auto-approved |
| **Landlord** | `pending` | ✅ Yes - Manual approval |
| **Maintenance** | `pending` | ✅ Yes - Manual approval |
| **Admin** | `active` | ❌ No - Auto-approved |

**Logic Location:** `server/models/userModel.js` → `updateVerified()` method

---

## 🔐 Admin User Management Interface

### Accessing User Management
1. Login as Admin
2. Navigate to Admin Dashboard
3. Click **"Users"** in navigation menu
4. Opens `/admin/users.html`

### User Directory Table Columns
- **Name:** Full name of user
- **Email:** Registration email
- **Role:** Tenant, Landlord, Maintenance, or Admin
- **Verified:** Email verification status (✓ Yes / ✗ No)
- **Account Status:** `pending`, `active`, `disabled`, `rejected`
- **Registered Date:** Account creation date
- **Actions:** Approve / Reject / Disable / Reactivate buttons

---

## 🎯 Admin Actions Available

### For Users with Status: `pending`

**Action Buttons:**
- 🟢 **Approve** - Changes status to `active`, user can login
- 🔴 **Reject** - Changes status to `rejected`, user cannot login

### For Users with Status: `active`

**Action Buttons:**
- ⚫ **Disable** - Changes status to `disabled`, blocks login access

### For Users with Status: `disabled` or `rejected`

**Action Buttons:**
- 🔵 **Reactivate** - Changes status to `active`, restores access

### For Admin Users

**Action Buttons:**
- *No actions available* - Admins cannot modify other admin accounts

---

## 🔧 Technical Implementation

### Backend API

**Endpoint:** `PUT /api/users/:id/status`

**Request:**
```json
{
  "account_status": "active" | "disabled" | "rejected" | "pending"
}
```

**Authentication:** Requires JWT token with `admin` role

**Authorization:** Only admins can update user status

**Code Files:**
- **Route:** `server/routes/userRoutes.js` (Line 49)
- **Controller:** `server/controllers/userController.js` → `updateUserStatus()`
- **Model:** `server/models/userModel.js` → `updateStatus()`
- **Frontend:** `public/pages/admin/users.html`

### Database

**Table:** `users`

**Status Column:** `account_status VARCHAR(20)`

**Allowed Values:**
- `pending` - Awaiting admin approval
- `active` - Approved, can login and use system
- `disabled` - Temporarily blocked by admin
- `rejected` - Registration rejected by admin

---

## 📊 Example Workflow

### Scenario: New Landlord Registration

**Step 1:** John Doe registers as Landlord
- Email: john@example.com
- Role: Landlord
- Status after email verification: `pending`
- Can login? ❌ No - "Account pending admin approval" message

**Step 2:** Admin reviews registration
- Admin logs into `/admin/users.html`
- Sees John Doe in users table
- Status badge shows: `PENDING` (yellow)

**Step 3a:** Admin approves (Approve button)
- Clicks "Approve" button
- API call: `PUT /api/users/{john-id}/status` with `account_status: "active"`
- Database updated: `account_status = 'active'`
- Audit log created: "Admin changed user status to active"
- Status badge changes to: `ACTIVE` (green)
- Can John login now? ✅ Yes - Full system access

**Step 3b:** Admin rejects (Reject button)
- Clicks "Reject" button
- API call: `PUT /api/users/{john-id}/status` with `account_status: "rejected"`
- Database updated: `account_status = 'rejected'`
- Status badge changes to: `REJECTED` (red)
- Can John login now? ❌ No - "Account has been rejected" message

---

## 🔍 Troubleshooting

### Issue: "Approve button not visible"

**Possible Causes:**
1. User is not logged in as Admin
2. User account is already `active`
3. Target user is an Admin (cannot modify admin accounts)

**Solution:**
- Verify you're logged in with admin role
- Check user's current status in table

### Issue: "Failed to update user status"

**Possible Causes:**
1. Database connection error
2. Invalid JWT token
3. Insufficient permissions
4. User ID not found

**Solution:**
- Check browser console for errors
- Verify JWT token is valid
- Confirm user has admin role
- Check network tab for API response

### Issue: "User list not loading"

**Possible Causes:**
1. API endpoint not responding
2. Database query error
3. Authentication failure

**Solution:**
- Check API endpoint `/api/users` is accessible
- Verify admin is authenticated
- Check server logs for errors

---

## 🎓 Security Features

### Access Control
✅ Only users with `role = 'admin'` can access user management  
✅ JWT token validation on all requests  
✅ Admins cannot modify other admin accounts  
✅ All actions logged in audit trail  

### Audit Logging
Every status change creates an audit log entry:
- Admin user ID
- Action: `ADMIN_USER_STATUS_UPDATE`
- Description: "Admin changed user {id} status to {status}"
- Timestamp and IP address tracked

View audit logs at: `/admin/audit-logs.html`

---

## ✅ CONCLUSION

**The admin user approval system is FULLY FUNCTIONAL and includes:**

1. ✅ Email verification system
2. ✅ Automatic status assignment based on role
3. ✅ Admin user management interface
4. ✅ Approve/Reject/Disable/Reactivate actions
5. ✅ Complete API implementation
6. ✅ Database status tracking
7. ✅ Comprehensive audit logging
8. ✅ Security and access control
9. ✅ Role-based access restrictions
10. ✅ Production-ready implementation

**Admin CAN approve user registrations.** The system is working as designed.

---

## 📞 Quick Reference

**Admin Users Page:** `/admin/users.html`  
**API Endpoint:** `PUT /api/users/:id/status`  
**Required Role:** `admin`  
**Database Table:** `users.account_status`  

---

*Last Updated: January 26, 2025*  
*DomiKnow Platform - User Management System*
