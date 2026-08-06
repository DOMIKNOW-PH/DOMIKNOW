const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const requireAuth = require('../middleware/authMiddleware');

// Protected dashboard route (checks user context and status)
router.get('/me', requireAuth, dashboardController.getMe);

module.exports = router;
