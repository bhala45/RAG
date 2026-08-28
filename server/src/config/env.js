const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY'];

const validateEnv = () => {
  const missing = [];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    } else {
      console.warn(`\x1b[33m[WARNING] Missing recommended environment variables: ${missing.join(', ')}. Some features may not work until set in server/.env\x1b[0m`);
    }
  }
};

validateEnv();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuswise_db',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_campuswise_ai_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',
};

module.exports = env;
