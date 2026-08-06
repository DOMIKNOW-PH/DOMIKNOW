# OBJECTIVE 1: AUTHENTICATION & USER MANAGEMENT
## Comprehensive Test Plan

**Status:** ✅ READY FOR TESTING  
**Date:** July 26, 2026  
**Test Environment:** http://localhost:3000  

---

## PRE-TEST CHECKLIST

### Environment Setup
- [x] `.env` file configured with all required variables
- [x] Database tables created (users, verification_codes, audit_logs)
- [x] Email configuration verified (SMTP settings)
- [x] Security packages installed
- [x] Server running on http://localhost:3000

### Required Test Data
- [ ] At least 3 unique email addresses for testing
- [ ] Access to email inbox for verification codes
- [ ] Admin account credentials (from seedAdmin.js)

---

## TEST SUITE 1: USER REGISTRATION

### TC1.1: Successful Registration - Tenant
**Priority:** High  
**Steps:**
1. Navigate to http://localhost:3000/pages/auth/register.html
2. Fill form:
   - Full Name: "Test Tenant"
   - Email: "tenant@test.com"
   - Password: "Pass1234" (meets requirements)
   - Role: "tenant"
   - Contact: "09123456789"
   - Address: "123 Test St"
3. Click "Register"

**Expected Results:**
- ✓ Form submits successfully
- ✓ Success message displayed
- ✓ Redirect to verify-code.html with email parameter
- ✓ Email parameter auto-filled in verification form
- ✓ Verification email received within 2 minutes
- ✓ User record created with is_verified=false, account_status='pending'
- ✓ Audit log entry "REGISTER" created

**Actual Results:** ___________________________________________

---

### TC1.2: Successful Registration - Landlord
**Priority:** High  
**Steps:**
1. Navigate to register page
2. Fill form with role="landlord", unique email
3. Submit form

**Expected Results:**
- ✓ Registration successful
- ✓ account_status set to 'pending' (requires admin approval)
- ✓ Verification email sent

**Actual Results:** ___________________________________________

---

### TC1.3: Successful Registration - Maintenance
**Priority:** Medium  
**Steps:**
1. Navigate to register page
2. Fill form with role="maintenance", unique email
3. Submit form

**Expected Results:**
- ✓ Registration successful
- ✓ account_status set to 'pending' (requires admin approval)

**Actual Results:** ___________________________________________

---

### TC1.4: Registration - Weak Password
**Priority:** High  
**Steps:**
1. Fill registration form with password="weak"
2. Submit

**Expected Results:**
- ✓ Client-side validation error displayed
- ✓ Password strength indicator shows "weak"
- ✓ Form does not submit
- ✓ OR backend returns 400 with validation error

**Actual Results:** ___________________________________________

---

### TC1.5: Registration - Invalid Email Format
**Priority:** High  
**Steps:**
1. Fill form with email="notanemail"
2. Submit

**Expected Results:**
- ✓ Client-side validation error: "Invalid email format"
- ✓ Form does not submit

**Actual Results:** ___________________________________________

---

### TC1.6: Registration - Duplicate Email
**Priority:** High  
**Steps:**
1. Register with email="duplicate@test.com"
2. Try to register again with same email

**Expected Results:**
- ✓ Backend returns 400 error
- ✓ Message: "Email already exists"
- ✓ No duplicate user created

**Actual Results:** ___________________________________________

---

### TC1.7: Registration - Rate Limiting
**Priority:** Medium  
**Steps:**
1. Submit registration form 6 times within 1 minute

**Expected Results:**
- ✓ First 5 requests succeed
- ✓ 6th request returns 429 error
- ✓ Message: "Too many registration attempts, please try again later"

**Actual Results:** ___________________________________________

---

### TC1.8: Registration - Password Strength Indicator
**Priority:** Low  
**Steps:**
1. Type various passwords in password field
   - "weak"
   - "Medium1"
   - "StrongPass123"

**Expected Results:**
- ✓ Indicator updates in real-time
- ✓ Color changes (red → yellow → green)
- ✓ Text shows strength level

**Actual Results:** ___________________________________________

---

### TC1.9: Registration - Show/Hide Password
**Priority:** Low  
**Steps:**
1. Type password
2. Click "Show" button

**Expected Results:**
- ✓ Password becomes visible
- ✓ Button changes to "Hide"
- ✓ Click again hides password

**Actual Results:** ___________________________________________

---

## TEST SUITE 2: EMAIL VERIFICATION

### TC2.1: Successful Verification
**Priority:** High  
**Prerequisites:** Complete TC1.1 (registration)

**Steps:**
1. Check email inbox for verification code
2. Copy 6-digit code
3. Paste into verification form
4. Submit

**Expected Results:**
- ✓ Verification successful
- ✓ Success message: "Email verified successfully. You can now log in" (tenant)
- ✓ OR "Please wait for admin approval" (landlord/maintenance)
- ✓ User.is_verified set to true
- ✓ User.account_status updated (tenant→active, others→pending)
- ✓ Verification code marked as used
- ✓ Audit log "EMAIL_VERIFIED" created

**Actual Results:** ___________________________________________

---

### TC2.2: Verification - Invalid Code
**Priority:** High  
**Steps:**
1. Enter code="123456" (invalid/wrong code)
2. Submit

**Expected Results:**
- ✓ Error: "Invalid or expired verification code"
- ✓ Form not cleared
- ✓ User remains unverified

**Actual Results:** ___________________________________________

---

### TC2.3: Verification - Expired Code
**Priority:** Medium  
**Steps:**
1. Wait 16 minutes after registration (code expires in 15 min)
2. Try to verify with original code

**Expected Results:**
- ✓ Error: "Invalid or expired verification code"
- ✓ User remains unverified

**Actual Results:** ___________________________________________

---

### TC2.4: Verification - Already Verified Email
**Priority:** Low  
**Steps:**
1. Verify email successfully
2. Try to verify again with same code

**Expected Results:**
- ✓ Error or message indicating already verified

**Actual Results:** ___________________________________________

---

### TC2.5: Resend Verification Code
**Priority:** High  
**Steps:**
1. On verify-code page, click "Resend Code" button
2. Wait for cooldown timer (60 seconds)
3. Click "Resend Code" again

**Expected Results:**
- ✓ New code sent to email
- ✓ Success message displayed
- ✓ Cooldown timer appears (60s countdown)
- ✓ Button disabled during cooldown
- ✓ After cooldown, button enabled again
- ✓ New code works for verification
- ✓ Audit log "RESEND_CODE" created

**Actual Results:** ___________________________________________

---

### TC2.6: Verification - Numeric Input Only
**Priority:** Low  
**Steps:**
1. Try to type letters in code field

**Expected Results:**
- ✓ Only numbers accepted
- ✓ Auto-caps at 6 digits

**Actual Results:** ___________________________________________

---

### TC2.7: Verification - Rate Limiting
**Priority:** Medium  
**Steps:**
1. Submit verification form 11 times within 1 minute

**Expected Results:**
- ✓ First 10 requests process
- ✓ 11th request returns 429 error

**Actual Results:** ___________________________________________

---

## TEST SUITE 3: USER LOGIN

### TC3.1: Successful Login - Tenant (Verified, Active)
**Priority:** High  
**Prerequisites:** User registered, verified, status=active

**Steps:**
1. Navigate to http://localhost:3000/pages/auth/login.html
2. Enter email and password
3. Submit

**Expected Results:**
- ✓ Login successful
- ✓ JWT token generated
- ✓ Token stored in localStorage
- ✓ Redirect to /pages/tenant/dashboard.html
- ✓ Dashboard displays user's name
- ✓ Audit log "LOGIN_SUCCESS" created

**Actual Results:** ___________________________________________

---

### TC3.2: Successful Login - Landlord
**Priority:** High  
**Prerequisites:** Landlord approved by admin

**Steps:**
1. Login with landlord credentials

**Expected Results:**
- ✓ Redirect to /pages/landlord/dashboard.html
- ✓ Landlord-specific navigation visible

**Actual Results:** ___________________________________________

---

### TC3.3: Successful Login - Maintenance
**Priority:** Medium  
**Prerequisites:** Maintenance user approved

**Steps:**
1. Login with maintenance credentials

**Expected Results:**
- ✓ Redirect to /pages/maintenance/dashboard.html

**Actual Results:** ___________________________________________

---

### TC3.4: Successful Login - Admin
**Priority:** High  
**Prerequisites:** Admin account exists (from seedAdmin.js)

**Steps:**
1. Login with admin credentials

**Expected Results:**
- ✓ Redirect to /pages/admin/dashboard.html
- ✓ Admin navigation visible

**Actual Results:** ___________________________________________

---

### TC3.5: Login - Invalid Credentials
**Priority:** High  
**Steps:**
1. Enter email="test@test.com", password="WrongPass123"
2. Submit

**Expected Results:**
- ✓ Error: "Invalid credentials"
- ✓ No token generated
- ✓ Audit log "LOGIN_FAILED" created

**Actual Results:** ___________________________________________

---

### TC3.6: Login - Unverified Email
**Priority:** High  
**Prerequisites:** User registered but not verified

**Steps:**
1. Login with unverified user credentials

**Expected Results:**
- ✓ Error: "Please verify your email before logging in"
- ✓ HTTP status 403
- ✓ No token generated
- ✓ Audit log "LOGIN_BLOCKED" created

**Actual Results:** ___________________________________________

---

### TC3.7: Login - Pending Account (Landlord/Maintenance)
**Priority:** High  
**Prerequisites:** Landlord/maintenance registered, verified, but not approved

**Steps:**
1. Login with pending landlord credentials

**Expected Results:**
- ✓ Error: "Your account is pending admin approval"
- ✓ HTTP status 403
- ✓ Audit log "LOGIN_BLOCKED" created

**Actual Results:** ___________________________________________

---

### TC3.8: Login - Disabled Account
**Priority:** High  
**Prerequisites:** Admin disabled user account

**Steps:**
1. Login with disabled user credentials

**Expected Results:**
- ✓ Error: "Your account has been disabled. Contact support"
- ✓ HTTP status 403

**Actual Results:** ___________________________________________

---

### TC3.9: Login - Rejected Account
**Priority:** Medium  
**Prerequisites:** Admin rejected user application

**Steps:**
1. Login with rejected user credentials

**Expected Results:**
- ✓ Error: "Your account application was rejected"
- ✓ HTTP status 403

**Actual Results:** ___________________________________________

---

### TC3.10: Login - Rate Limiting
**Priority:** Medium  
**Steps:**
1. Submit login form 6 times within 1 minute

**Expected Results:**
- ✓ First 5 requests process
- ✓ 6th returns 429 error
- ✓ Message: "Too many login attempts, please try again later"

**Actual Results:** ___________________________________________

---

### TC3.11: Login - Show/Hide Password
**Priority:** Low  
**Steps:**
1. Type password, click "Show" button

**Expected Results:**
- ✓ Password visible
- ✓ Button toggles Show/Hide

**Actual Results:** ___________________________________________

---

## TEST SUITE 4: JWT AUTHENTICATION & AUTHORIZATION

### TC4.1: Access Protected Route with Valid Token
**Priority:** High  
**Prerequisites:** User logged in

**Steps:**
1. Open browser DevTools → Network tab
2. Navigate to dashboard
3. Check Authorization header in API requests

**Expected Results:**
- ✓ Token included in all API requests
- ✓ Format: "Bearer <token>"
- ✓ Protected endpoints return data

**Actual Results:** ___________________________________________

---

### TC4.2: Access Protected Route without Token
**Priority:** High  
**Steps:**
1. Clear localStorage
2. Try to access /pages/tenant/dashboard.html directly

**Expected Results:**
- ✓ Redirect to /pages/auth/login.html
- ✓ Or API returns 401 Unauthorized

**Actual Results:** ___________________________________________

---

### TC4.3: Access Protected Route with Invalid Token
**Priority:** High  
**Steps:**
1. Set localStorage token to "invalid.token.value"
2. Try to access dashboard

**Expected Results:**
- ✓ Token validation fails
- ✓ Redirect to login
- ✓ API returns 401

**Actual Results:** ___________________________________________

---

### TC4.4: Token Expiration (7 days)
**Priority:** Low  
**Note:** Cannot test quickly - requires time manipulation

**Expected Results:**
- ✓ Token expires after 7 days
- ✓ User must re-login

**Actual Results:** ___________________________________________

---

### TC4.5: Role-Based Access Control - Admin Only Routes
**Priority:** High  
**Prerequisites:** Login as non-admin (tenant)

**Steps:**
1. Try to access admin route: GET /api/users
2. Use browser console or Postman

**Expected Results:**
- ✓ API returns 403 Forbidden
- ✓ Message: "Access denied. Required role(s): admin"

**Actual Results:** ___________________________________________

---

### TC4.6: Role-Based Access Control - Multi-Role Routes
**Priority:** Medium  
**Steps:**
1. Login as tenant
2. Access GET /api/users/me (allowed for all roles)

**Expected Results:**
- ✓ Request succeeds
- ✓ Returns user profile data

**Actual Results:** ___________________________________________

---

## TEST SUITE 5: USER PROFILE MANAGEMENT

### TC5.1: Get Current User Profile
**Priority:** High  
**Prerequisites:** User logged in

**Steps:**
1. Send GET request to /api/users/me
2. Include Authorization header

**Expected Results:**
- ✓ Returns user object with all fields
- ✓ Password hash NOT included in response
- ✓ HTTP 200

**Actual Results:** ___________________________________________

---

### TC5.2: Update Profile - Valid Data
**Priority:** High  
**Steps:**
1. Send PUT request to /api/users/me
2. Body: { "full_name": "Updated Name", "contact_number": "09999999999" }

**Expected Results:**
- ✓ Profile updated successfully
- ✓ Returns updated user object
- ✓ Audit log "PROFILE_UPDATE" created

**Actual Results:** ___________________________________________

---

### TC5.3: Update Profile - Invalid Data
**Priority:** Medium  
**Steps:**
1. Send PUT /api/users/me
2. Body: { "full_name": "A" } (too short)

**Expected Results:**
- ✓ Validation error: "Full name must be between 2 and 255 characters"
- ✓ HTTP 400

**Actual Results:** ___________________________________________

---

### TC5.4: Update Profile - Cannot Change Email/Password
**Priority:** Medium  
**Steps:**
1. Send PUT /api/users/me
2. Body: { "email": "newemail@test.com", "password": "newpass" }

**Expected Results:**
- ✓ Email and password fields ignored
- ✓ Only allowed fields updated

**Actual Results:** ___________________________________________

---

## TEST SUITE 6: ADMIN USER MANAGEMENT

### TC6.1: Get All Users (Admin)
**Priority:** High  
**Prerequisites:** Login as admin

**Steps:**
1. Navigate to /pages/admin/users.html
2. Check if users list loads

**Expected Results:**
- ✓ All users displayed in table
- ✓ Columns: Name, Email, Role, Status, Verified, Created Date
- ✓ Status badges color-coded
- ✓ Role badges color-coded

**Actual Results:** ___________________________________________

---

### TC6.2: Approve Pending User (Landlord)
**Priority:** High  
**Steps:**
1. Find pending landlord in users list
2. Click "Approve" button

**Expected Results:**
- ✓ account_status changed to 'active'
- ✓ Success message displayed
- ✓ User can now log in
- ✓ Audit log created

**Actual Results:** ___________________________________________

---

### TC6.3: Reject Pending User
**Priority:** High  
**Steps:**
1. Find pending user
2. Click "Reject" button

**Expected Results:**
- ✓ account_status changed to 'rejected'
- ✓ User cannot log in
- ✓ Error message on login attempt

**Actual Results:** ___________________________________________

---

### TC6.4: Disable Active User
**Priority:** High  
**Steps:**
1. Find active user
2. Click "Disable" button

**Expected Results:**
- ✓ account_status changed to 'disabled'
- ✓ User cannot log in
- ✓ Existing sessions should be invalidated (if implemented)

**Actual Results:** ___________________________________________

---

### TC6.5: Reactivate Disabled User
**Priority:** Medium  
**Steps:**
1. Find disabled user
2. Click "Reactivate" button

**Expected Results:**
- ✓ account_status changed to 'active'
- ✓ User can log in again

**Actual Results:** ___________________________________________

---

### TC6.6: Get User by ID (Admin)
**Priority:** Medium  
**Steps:**
1. Send GET /api/users/:id (with valid UUID)

**Expected Results:**
- ✓ Returns specific user details
- ✓ HTTP 200

**Actual Results:** ___________________________________________

---

### TC6.7: Update User Status - Invalid UUID
**Priority:** Low  
**Steps:**
1. Send PUT /api/users/invalid-id/status

**Expected Results:**
- ✓ Validation error: "Invalid user ID format"
- ✓ HTTP 400

**Actual Results:** ___________________________________________

---

### TC6.8: Update User Status - Non-Admin
**Priority:** High  
**Prerequisites:** Login as tenant

**Steps:**
1. Try to send PUT /api/users/:id/status

**Expected Results:**
- ✓ 403 Forbidden
- ✓ Access denied

**Actual Results:** ___________________________________________

---

## TEST SUITE 7: SESSION MANAGEMENT

### TC7.1: Logout Functionality
**Priority:** High  
**Steps:**
1. Login successfully
2. Click "Logout" button in dashboard

**Expected Results:**
- ✓ Token removed from localStorage
- ✓ Redirect to login page
- ✓ Cannot access protected routes

**Actual Results:** ___________________________________________

---

### TC7.2: Token Persistence
**Priority:** Medium  
**Steps:**
1. Login successfully
2. Close browser
3. Reopen and navigate to dashboard

**Expected Results:**
- ✓ Token still in localStorage
- ✓ User remains logged in
- ✓ Dashboard accessible

**Actual Results:** ___________________________________________

---

### TC7.3: Multiple Browser Tabs
**Priority:** Low  
**Steps:**
1. Login in Tab 1
2. Open Tab 2, access dashboard

**Expected Results:**
- ✓ Both tabs use same token
- ✓ Both show user as logged in

**Actual Results:** ___________________________________________

---

## TEST SUITE 8: SECURITY FEATURES

### TC8.1: CORS Protection
**Priority:** High  
**Steps:**
1. Try to make API request from different origin (e.g., Postman with Origin header)

**Expected Results:**
- ✓ Request blocked if origin not in whitelist
- ✓ OR allowed if NODE_ENV=development

**Actual Results:** ___________________________________________

---

### TC8.2: Security Headers (Helmet)
**Priority:** Medium  
**Steps:**
1. Make any API request
2. Check response headers

**Expected Results:**
- ✓ X-Content-Type-Options: nosniff
- ✓ X-Frame-Options: SAMEORIGIN
- ✓ Content-Security-Policy present
- ✓ Strict-Transport-Security (if HTTPS)

**Actual Results:** ___________________________________________

---

### TC8.3: SQL Injection Prevention
**Priority:** High  
**Steps:**
1. Try login with email="admin@test.com' OR '1'='1"

**Expected Results:**
- ✓ Query parameterization prevents injection
- ✓ Login fails with invalid credentials

**Actual Results:** ___________________________________________

---

### TC8.4: XSS Prevention
**Priority:** High  
**Steps:**
1. Register with name="<script>alert('XSS')</script>"

**Expected Results:**
- ✓ Script tags escaped or sanitized
- ✓ No JavaScript execution
- ✓ Displayed as plain text

**Actual Results:** ___________________________________________

---

### TC8.5: Password Hashing
**Priority:** High  
**Steps:**
1. Check database users table
2. View password_hash column

**Expected Results:**
- ✓ Passwords stored as bcrypt hashes
- ✓ No plaintext passwords
- ✓ Hash starts with "$2b$12$" (bcrypt format)

**Actual Results:** ___________________________________________

---

### TC8.6: Request Body Size Limit
**Priority:** Low  
**Steps:**
1. Try to send request with body > 10MB

**Expected Results:**
- ✓ Request rejected
- ✓ Error: "Request entity too large"

**Actual Results:** ___________________________________________

---

## TEST SUITE 9: AUDIT LOGGING

### TC9.1: Audit Log - Registration
**Priority:** Medium  
**Steps:**
1. Register new user
2. Check audit_logs table

**Expected Results:**
- ✓ Log entry created
- ✓ action='REGISTER'
- ✓ user_id matches new user
- ✓ description contains role info

**Actual Results:** ___________________________________________

---

### TC9.2: Audit Log - Login Success
**Priority:** Medium  
**Steps:**
1. Login successfully
2. Check audit_logs

**Expected Results:**
- ✓ action='LOGIN_SUCCESS'
- ✓ timestamp recorded

**Actual Results:** ___________________________________________

---

### TC9.3: Audit Log - Login Failed
**Priority:** Medium  
**Steps:**
1. Login with wrong password
2. Check audit_logs

**Expected Results:**
- ✓ action='LOGIN_FAILED'
- ✓ description='Invalid password'

**Actual Results:** ___________________________________________

---

### TC9.4: Audit Log - Admin Actions
**Priority:** Medium  
**Steps:**
1. Admin approves user
2. Check audit_logs

**Expected Results:**
- ✓ action='ADMIN_USER_STATUS_UPDATE'
- ✓ admin_id as user_id
- ✓ description contains target user ID and new status

**Actual Results:** ___________________________________________

---

## TEST SUITE 10: FRONTEND VALIDATION

### TC10.1: Client-Side Email Validation
**Priority:** Low  
**Steps:**
1. Type invalid email in registration form
2. Try to submit

**Expected Results:**
- ✓ Browser validation prevents submit
- ✓ Error message shown

**Actual Results:** ___________________________________________

---

### TC10.2: Client-Side Password Validation
**Priority:** Low  
**Steps:**
1. Type short password (<8 chars)
2. Try to submit

**Expected Results:**
- ✓ Validation error shown
- ✓ Form doesn't submit

**Actual Results:** ___________________________________________

---

### TC10.3: Form Error Messages Display
**Priority:** Medium  
**Steps:**
1. Submit form with backend validation error

**Expected Results:**
- ✓ Error message displayed prominently
- ✓ Red alert box with error icon
- ✓ Error auto-dismisses or has close button

**Actual Results:** ___________________________________________

---

### TC10.4: Loading States
**Priority:** Low  
**Steps:**
1. Submit registration form
2. Observe button state

**Expected Results:**
- ✓ Submit button disabled during request
- ✓ Loading indicator shown
- ✓ Button re-enabled after response

**Actual Results:** ___________________________________________

---

## TEST SUMMARY

| Test Suite | Total Tests | Passed | Failed | Skipped |
|------------|-------------|--------|--------|---------|
| 1. Registration | 9 | ___ | ___ | ___ |
| 2. Verification | 7 | ___ | ___ | ___ |
| 3. Login | 11 | ___ | ___ | ___ |
| 4. JWT Auth | 6 | ___ | ___ | ___ |
| 5. Profile | 4 | ___ | ___ | ___ |
| 6. Admin Management | 8 | ___ | ___ | ___ |
| 7. Session | 3 | ___ | ___ | ___ |
| 8. Security | 6 | ___ | ___ | ___ |
| 9. Audit | 4 | ___ | ___ | ___ |
| 10. Frontend | 4 | ___ | ___ | ___ |
| **TOTAL** | **62** | ___ | ___ | ___ |

---

## KNOWN ISSUES & LIMITATIONS

1. **Password Reset:** Not implemented
2. **2FA:** Not available
3. **Account Lockout:** Relies on rate limiting only (no permanent lockout)
4. **Session Timeout Warning:** No UI warning before token expiration
5. **Email Notifications:** Only verification emails (no login alerts)
6. **Profile Image Upload:** Not integrated
7. **Token Refresh:** Not implemented (tokens expire after 7 days)

---

## TEST ENVIRONMENT DETAILS

**Server:** Node.js + Express  
**Database:** PostgreSQL (via Supabase)  
**Email:** Nodemailer (configured via .env)  
**Port:** 3000  
**Browser:** Chrome/Edge (latest)  

---

## PASS CRITERIA

- **Critical Tests (Priority: High):** 100% pass rate required
- **Medium Tests:** 90% pass rate minimum
- **Low Tests:** 80% pass rate acceptable

**Objective 1 is considered COMPLETE when:**
- ✓ All High priority tests pass
- ✓ No critical security vulnerabilities
- ✓ Backend and frontend fully integrated
- ✓ All core auth flows functional

---

**Tester:** ___________________________  
**Date Tested:** ___________________________  
**Overall Result:** [ ] PASS  [ ] FAIL  [ ] NEEDS REVISION  

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
