const crypto = require('crypto');

/**
 * Generates a 6-digit numeric verification code
 * @returns {string} 6-digit code
 */
const generateVerificationCode = () => {
    // Generate a random number between 100000 and 999999
    return crypto.randomInt(100000, 999999).toString();
};

module.exports = generateVerificationCode;
