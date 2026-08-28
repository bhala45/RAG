const DocumentChunk = require('../models/DocumentChunk');

/**
 * Compute cosine similarity between two vectors (fallback for local development)
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Execute Dense Vector Search via MongoDB Atlas Vector Search index 'vector_index'
 * with automatic in-memory fallback if Atlas search index is not available.
 * @param {Array<number>} queryEmbedding - 768-dim float vector
 * @param {Object} options - { department, limit, numCandidates }
 */
const denseVectorSearch = async (queryEmbedding, options = {}) => {
  const { department, limit = 10, numCandidates = 50 } = options;

  // Build filter condition
  const filter = {};
  if (department && department !== 'All') {
    filter['metadata.department'] = { $in: [department, 'General'] };
  }

  try {
    // Attempt Atlas $vectorSearch pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: numCandidates,
          limit: limit,
          ...(department && department !== 'All'
            ? {
                filter: {
                  'metadata.department': { $in: [department, 'General'] },
                },
              }
            : {}),
        },
      },
      {
        $project: {
          _id: 1,
          documentId: 1,
          chunkIndex: 1,
          content: 1,
          pageNumber: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    const results = await DocumentChunk.aggregate(pipeline);
    if (results && results.length > 0) {
      return results;
    }
  } catch (atlasError) {
    console.warn(`[VectorSearchService] Atlas Vector Search unavailable (${atlasError.message}). Falling back to in-memory cosine search.`);
  }

  // Fallback: In-memory cosine similarity search across chunks
  const chunks = await DocumentChunk.find(filter)
    .select('_id documentId chunkIndex content pageNumber metadata embedding')
    .lean();

  const scoredChunks = chunks.map((chunk) => ({
    _id: chunk._id,
    documentId: chunk.documentId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    pageNumber: chunk.pageNumber,
    metadata: chunk.metadata,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort descending by score
  scoredChunks.sort((a, b) => b.score - a.score);

  return scoredChunks.slice(0, limit);
};

/**
 * Execute Sparse Keyword Search using MongoDB text index or regex
 */
const sparseKeywordSearch = async (queryText, options = {}) => {
  const { department, limit = 10 } = options;

  const filter = {};
  if (department && department !== 'All') {
    filter['metadata.department'] = { $in: [department, 'General'] };
  }

  try {
    const textResults = await DocumentChunk.find(
      { ...filter, $text: { $search: queryText } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .select('_id documentId chunkIndex content pageNumber metadata')
      .lean();

    if (textResults.length > 0) {
      return textResults;
    }
  } catch (error) {
    // If text index not yet built, fallback to regex keywords
  }

  // Regex fallback for keywords
  const keywords = queryText
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (keywords.length === 0) return [];

  const regex = new RegExp(keywords.join('|'), 'i');
  const regexResults = await DocumentChunk.find({ ...filter, content: regex })
    .limit(limit)
    .select('_id documentId chunkIndex content pageNumber metadata')
    .lean();

  return regexResults.map((item, idx) => ({
    ...item,
    score: 1 / (idx + 1),
  }));
};

/**
 * Reciprocal Rank Fusion (RRF) to combine dense vector and sparse keyword rankings
 * Score = sum(1 / (k + rank))
 */
const reciprocalRankFusion = (denseResults, sparseResults, k = 60, topK = 5) => {
  const scoreMap = new Map();

  // Dense rank fusion
  denseResults.forEach((doc, rank) => {
    const key = doc._id.toString();
    const currentScore = scoreMap.get(key)?.score || 0;
    const rrfScore = 1 / (k + rank + 1);
    scoreMap.set(key, {
      chunk: doc,
      score: currentScore + rrfScore * 0.7, // 70% weight to vector similarity
      vectorScore: doc.score || 0,
    });
  });

  // Sparse rank fusion
  sparseResults.forEach((doc, rank) => {
    const key = doc._id.toString();
    const existing = scoreMap.get(key);
    const rrfScore = 1 / (k + rank + 1);
    if (existing) {
      existing.score += rrfScore * 0.3; // 30% weight to keyword match
    } else {
      scoreMap.set(key, {
        chunk: doc,
        score: rrfScore * 0.3,
        vectorScore: 0,
      });
    }
  });

  const sorted = Array.from(scoreMap.values()).sort((a, b) => b.score - a.score);

  return sorted.slice(0, topK).map((item) => ({
    ...item.chunk,
    fusedScore: item.score,
    similarityScore: item.vectorScore,
  }));
};

module.exports = {
  cosineSimilarity,
  denseVectorSearch,
  sparseKeywordSearch,
  reciprocalRankFusion,
};
