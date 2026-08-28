const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('./env');

let genAI = null;

const getGoogleGenAI = () => {
  if (!genAI) {
    if (!env.GEMINI_API_KEY) {
      console.warn('\x1b[33m[Gemini] GEMINI_API_KEY is not configured. Gemini AI capabilities will be disabled or mocked.\x1b[0m');
    }
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'MOCK_KEY');
  }
  return genAI;
};

/**
 * Returns the Gemini Generative Model for chat & completions (default: gemini-1.5-flash)
 */
const getGenerativeModel = (modelName = 'gemini-1.5-flash', generationConfig = {}) => {
  const client = getGoogleGenAI();
  return client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
      ...generationConfig,
    },
  });
};

/**
 * Returns the Gemini Embedding Model (default: text-embedding-004)
 */
const getEmbeddingModel = (modelName = 'text-embedding-004') => {
  const client = getGoogleGenAI();
  return client.getGenerativeModel({ model: modelName });
};

module.exports = {
  getGoogleGenAI,
  getGenerativeModel,
  getEmbeddingModel,
};
