const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

/**
 * Generate a signed JWT token for a user
 */
const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    }
  );
};

/**
 * Register a new user
 */
const registerUser = async ({ name, email, password, role = 'student', department = 'General' }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 400;
    throw error;
  }

  // Create user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
    department,
  });

  const token = signToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      createdAt: user.createdAt,
    },
    token,
  };
};

/**
 * Authenticate user credentials and return token
 */
const loginUser = async ({ email, password }) => {
  // Find user and explicitly select password field
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = signToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      createdAt: user.createdAt,
    },
    token,
  };
};

/**
 * Get profile by user ID
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return user;
};

module.exports = {
  signToken,
  registerUser,
  loginUser,
  getUserById,
};
