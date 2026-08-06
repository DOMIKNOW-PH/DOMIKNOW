/**
 * Helper to standardise API responses
 */
const responseHelper = {
    success: (res, message, data = null, statusCode = 200) => {
        const response = {
            success: true,
            message
        };
        if (data) {
            response.data = data;
        }
        return res.status(statusCode).json(response);
    },

    error: (res, message, error = null, statusCode = 400) => {
        const response = {
            success: false,
            message
        };
        // In development you might want to send the error details
        if (error && process.env.NODE_ENV !== 'production') {
            response.error = error.message || error;
        }
        return res.status(statusCode).json(response);
    }
};

module.exports = responseHelper;
