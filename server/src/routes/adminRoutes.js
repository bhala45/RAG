const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// System telemetry & analytics
router.get('/analytics', protect, authorize('admin'), adminController.getAnalytics);

// Unhandled queries
router.get('/unhandled-queries', protect, authorize('admin'), adminController.getUnhandledQueries);
router.patch('/unhandled-queries/:id', protect, authorize('admin'), adminController.updateUnhandledQueryStatus);

module.exports = router;
