const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const requireAuth = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(requireAuth);

router.get('/my', notificationController.getMyNotifications);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
