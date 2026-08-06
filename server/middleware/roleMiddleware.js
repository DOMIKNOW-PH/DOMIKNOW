const responseHelper = require('../utils/responseHelper');

/**
 * Middleware to check if the authenticated user has the required role
 * @param  {...string} allowedRoles - List of roles permitted to access the route
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return responseHelper.error(res, 'User role not found. Authentication required.', null, 403);
        }

        if (!allowedRoles.includes(req.user.role)) {
            return responseHelper.error(res, 'Access denied. Insufficient permissions.', null, 403);
        }

        next();
    };
};

module.exports = requireRole;
