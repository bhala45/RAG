const { getEmbeddingModel } = require('../config/gemini');
const env = require('../config/env');

/**
 * Generate a deterministic dummy 768-dim float embedding for offline/testing mode
 */
const generateMockEmbedding = (text) => {
  const embedding = new Array(768).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < 768; i++) {
    embedding[i] = Math.sin(hash + i) * 0.1;
  }
  return embedding;
};

/**
 * Helper to pause execution
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate a 768-dimensional vector embedding for a single text string
 * @param {string} text
 * @returns {Promise<Array<number>>}
 */
const embedText = async (text, retries = 3) => {
  if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('[EmbeddingService] No valid GEMINI_API_KEY set. Generating simulated 768-dim embedding.');
    return generateMockEmbedding(text);
  }

  const model = getEmbeddingModel('gemini-embedding-001');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.embedContent({
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      });

      if (result && result.embedding && Array.isArray(result.embedding.values)) {
        return result.embedding.values;
      }
      throw new Error('Gemini API returned invalid embedding structure');
    } catch (error) {
      console.warn(`[EmbeddingService] Attempt ${attempt} failed: ${error.message}`);
      if (attempt === retries) {
        throw new Error(`Failed to generate embedding after ${retries} attempts: ${error.message}`);
      }
      // Exponential backoff
      await delay(Math.pow(2, attempt) * 500);
    }
  }
};

/**
 * Generate embeddings for an array of document chunks in batches
 * @param {Array<{ content: string }>} chunks
 * @param {number} batchSize
 * @returns {Promise<Array<Array<number>>>}
 */
const embedChunks = async (chunks, batchSize = 10) => {
  const embeddings = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    console.log(`[EmbeddingService] Processing embedding batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(chunks.length / batchSize)} (${batch.length} chunks)...`);

    const batchPromises = batch.map((chunk) => embedText(chunk.content));
    const batchResults = await Promise.all(batchPromises);
    embeddings.push(...batchResults);

    // Minor throttle between batches to respect rate limits
    if (i + batchSize < chunks.length) {
      await delay(250);
    }
  }

  return embeddings;
};

module.exports = {
  embedText,
  embedChunks,
  generateMockEmbedding,
};
