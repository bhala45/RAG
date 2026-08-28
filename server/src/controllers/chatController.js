const ragService = require('../services/ragService');
const Conversation = require('../models/Conversation');

/**
 * @desc    Process student query and stream response via Server-Sent Events (SSE)
 * @route   POST /api/chat/message
 * @access  Private / Public
 */
const sendMessage = async (req, res, next) => {
  try {
    const { query, departmentFilter = 'All', conversationId } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query text cannot be empty.',
      });
    }

    // Set Server-Sent Events (SSE) headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.write(`data: ${JSON.stringify({ type: 'start', message: 'Retrieving context from campus documents...' })}\n\n`);

    const result = await ragService.processRagQuery({
      query,
      departmentFilter,
      userId,
      conversationId,
      onChunk: (chunkText) => {
        res.write(`data: ${JSON.stringify({ type: 'token', token: chunkText })}\n\n`);
      },
    });

    // Send final payload with sources and confidence score
    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        sources: result.sources,
        confidenceScore: result.confidenceScore,
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error(`[ChatController] Stream error: ${error.message}`);
    if (!res.headersSent) {
      next(error);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }
};

/**
 * @desc    Get user's conversation history
 * @route   GET /api/chat/conversations
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ userId })
      .select('title departmentFilter updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific conversation with all message history
 * @route   GET /api/chat/conversations/:id
 * @access  Private
 */
const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({ _id: id, userId: req.user._id });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit feedback (like/dislike) for an AI response
 * @route   POST /api/chat/feedback
 * @access  Private
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { conversationId, messageId, feedback } = req.body;

    if (!['like', 'dislike', 'none'].includes(feedback)) {
      return res.status(400).json({
        success: false,
        error: "Feedback must be 'like', 'dislike', or 'none'.",
      });
    }

    const conversation = await Conversation.findOne({ _id: conversationId, userId: req.user._id });
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found.',
      });
    }

    const message = conversation.messages.id(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found.',
      });
    }

    message.feedback = feedback;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully.',
      data: { messageId, feedback },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getConversationById,
  submitFeedback,
};
