const mongoose = require('mongoose');
const analyticsService = require('../services/analyticsService');
const UnhandledQuery = require('../models/UnhandledQuery');
const env = require('../config/env');

/**
 * @desc    Get system telemetry and query analytics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin only)
 */
const getAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getSystemAnalytics();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unhandled (low confidence) queries log
 * @route   GET /api/admin/unhandled-queries
 * @access  Private (Admin only)
 */
const getUnhandledQueries = async (req, res, next) => {
  try {
    const { status = 'pending_review', page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [queries, total] = await Promise.all([
      UnhandledQuery.find(filter)
        .populate('userId', 'name email department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      UnhandledQuery.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        queries,
        pagination: {
          total,
          page: parseInt(page, 10),
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update unhandled query status
 * @route   PATCH /api/admin/unhandled-queries/:id
 * @access  Private (Admin only)
 */
const updateUnhandledQueryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending_review', 'resolved', 'ignored'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be 'pending_review', 'resolved', or 'ignored'.",
      });
    }

    const query = await UnhandledQuery.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!query) {
      return res.status(404).json({
        success: false,
        error: 'Query record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Query status updated successfully.',
      data: query,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    System health check endpoint
 * @route   GET /api/health
 * @access  Public
 */
const getHealth = async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const geminiConfigured = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'your_gemini_api_key_here');

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: mongoStatus,
        name: mongoose.connection.name || 'campuswise_db',
      },
      aiEngine: {
        provider: 'Google Gemini',
        embeddingModel: 'text-embedding-004 (768-dim)',
        generativeModel: 'gemini-1.5-flash',
        apiKeyConfigured: geminiConfigured,
      },
    },
    environment: env.NODE_ENV,
  });
};

module.exports = {
  getAnalytics,
  getUnhandledQueries,
  updateUnhandledQueryStatus,
  getHealth,
};
