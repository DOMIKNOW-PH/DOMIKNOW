const { validationResult } = require('express-validator');
const responseHelper = require('../utils/responseHelper');

/**
 * Middleware to handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
        }));
        
        return responseHelper.error(
            res, 
            'Validation failed', 
            { errors: errorMessages }, 
            400
        );
    }
    
    next();
};

module.exports = handleValidationErrors;
