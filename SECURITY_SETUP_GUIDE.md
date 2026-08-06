# DOMIKNOW SECURITY SETUP GUIDE

## ⚠️ CRITICAL: Environment Variables Security

### **IMMEDIATE ACTIONS REQUIRED**

If you have committed `.env` file to git, follow these steps:

1. **Remove `.env` from git history:**
   ```bash
   git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```

2. **Rotate ALL secrets immediately:**
   - Generate new JWT_SECRET
   - Rotate Supabase Service Key
   - Change email password
   - Update all environment variables

3. **Verify `.env` is in `.gitignore`:**
   ```bash
   # Already added - verified ✓
   ```

### Setting Up Environment Variables

1. **Copy the example file:**
   ```bash
   copy .env.example .env
   ```

2. **Generate a strong JWT secret:**
   ```bash
   # Windows PowerShell
   [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
   ```

3. **Fill in your actual values in `.env`:**
   - `JWT_SECRET`: Use the generated secret above
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
   - `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`: Your SMTP credentials
   - `ALLOWED_ORIGINS`: Your frontend URL(s), comma-separated

## Security Features Implemented

### ✅ Input Validation
- All user inputs are validated using express-validator
- Email format validation
- Password strength requirements (min 8 chars, uppercase, lowercase, number)
- SQL injection prevention via parameterized queries

### ✅ Rate Limiting
- Registration: 5 attempts per 15 minutes
- Login: 5 attempts per 15 minutes  
- Verification: 10 attempts per 15 minutes

### ✅ CORS Protection
- Whitelist-based origin checking
- Configurable via `ALLOWED_ORIGINS` environment variable
- Credentials support enabled

### ✅ Security Headers (Helmet.js)
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HTTPS)

### ✅ Password Security
- bcrypt hashing with salt rounds
- Password strength requirements enforced
- Passwords never stored in plain text

### ✅ JWT Security
- Secure token generation
- Token expiration (configurable, default 7 days)
- Signature verification on every request

### ✅ Response Compression
- Reduces bandwidth usage
- Improves page load times

## Password Requirements

Users must create passwords that:
- Are at least 8 characters long
- Contain at least one uppercase letter
- Contain at least one lowercase letter
- Contain at least one number

## API Security

### Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Role-Based Access Control
Routes are protected by role:
- **Admin**: Full system access
- **Landlord**: Property management access
- **Tenant**: Rental process access
- **Maintenance**: Task management access

## Production Checklist

Before deploying to production:

- [ ] Rotate all secrets from development
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Configure proper `ALLOWED_ORIGINS`
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test rate limiting
- [ ] Review and update security headers
- [ ] Implement additional monitoring
- [ ] Set up error tracking (e.g., Sentry)

## Monitoring Recommendations

1. **Log failed login attempts**
2. **Monitor rate limit hits**
3. **Track admin actions via audit logs**
4. **Set up alerts for suspicious activity**
5. **Regular security audits**

## Support

For security concerns, contact the development team immediately.

**Last Updated:** July 25, 2026
