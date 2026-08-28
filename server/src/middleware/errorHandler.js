const env = require('../config/env');

// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(`\x1b[31m[Error Handler] ${err.name || 'Error'}: ${err.message}\x1b[0m`);
  if (!env.isProduction && err.stack) {
    console.error(err.stack);
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value entered for '${field}'. Please use another value.`;
    return res.status(400).json({
      success: false,
      error: message,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: message.join(', '),
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Resource not found with ID: ${err.value}`;
    return res.status(404).json({
      success: false,
      error: message,
    });
  }

  // Multer file limit error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'Uploaded file exceeds the maximum limit of 25MB.',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token. Please authenticate again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired. Please log in again.',
    });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
