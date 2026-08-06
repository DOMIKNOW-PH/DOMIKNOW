const jwt = require('jsonwebtoken');
const responseHelper = require('../utils/responseHelper');

const requireAuth = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return responseHelper.error(res, 'Authentication token is missing or invalid format', null, 401);
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return responseHelper.error(res, 'Authentication token is missing', null, 401);
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to request
        req.user = decoded;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return responseHelper.error(res, 'Token has expired', null, 401);
        }
        return responseHelper.error(res, 'Invalid authentication token', error, 401);
    }
};

module.exports = requireAuth;
