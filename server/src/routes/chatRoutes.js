const express = require('express');
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// SSE Chat streaming endpoint (Protected or optional auth)
router.post('/message', (req, res, next) => {
  // Allow anonymous queries or authenticated queries
  if (req.headers.authorization) {
    protect(req, res, next);
  } else {
    next();
  }
}, chatController.sendMessage);

// Conversation management (Protected)
router.get('/conversations', protect, chatController.getConversations);
router.get('/conversations/:id', protect, chatController.getConversationById);
router.post('/feedback', protect, chatController.submitFeedback);

module.exports = router;
