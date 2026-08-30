const { getGenerativeModel } = require('../config/gemini');
const embeddingService = require('./embeddingService');
const vectorSearchService = require('./vectorSearchService');
const UnhandledQuery = require('../models/UnhandledQuery');
const Conversation = require('../models/Conversation');

const SYSTEM_INSTRUCTION = `You are CampusWise AI, an expert, official college knowledge assistant.
Answer strictly and accurately based on the provided college document context below.
Rules:
1. Ground your answer completely in the facts provided in the context.
2. If the answer cannot be found in or deduced from the provided context, state clearly: "I am sorry, but this information is not available in the college documents." Do NOT attempt to guess, hallucinate, or use external knowledge for campus policies.
3. Be professional, structured, and helpful. Use bullet points or bold text where appropriate for clarity.
4. When stating facts, refer to the document or section where relevant.`;

/**
 * Assemble context string and sources list from retrieved chunks
 */
const buildContextAndSources = (chunks) => {
  const sources = [];
  const contextParts = chunks.map((chunk, idx) => {
    const docTitle = chunk.metadata?.documentTitle || 'Campus Document';
    const pageNum = chunk.pageNumber || 1;
    const snippet = chunk.content.length > 250 ? chunk.content.substring(0, 250) + '...' : chunk.content;

    sources.push({
      documentId: chunk.documentId,
      title: docTitle,
      pageNumber: pageNum,
      snippet: snippet,
    });

    return `[Context Chunk ${idx + 1}] (Document: "${docTitle}", Page: ${pageNum}, Department: ${chunk.metadata?.department || 'General'})\n${chunk.content}`;
  });

  return {
    contextString: contextParts.join('\n\n---\n\n'),
    sources,
  };
};

/**
 * Execute full RAG pipeline for a student query with streaming support
 */
const processRagQuery = async ({ query, departmentFilter = 'All', userId = null, conversationId = null, onChunk = null }) => {
  // 1. Generate query embedding (768-dim)
  const queryEmbedding = await embeddingService.embedText(query);

  // 2. Perform Dense Vector Search
  const denseResults = await vectorSearchService.denseVectorSearch(queryEmbedding, {
    department: departmentFilter,
    limit: 10,
    numCandidates: 50,
  });

  // 3. Perform Sparse Keyword Search
  const sparseResults = await vectorSearchService.sparseKeywordSearch(query, {
    department: departmentFilter,
    limit: 10,
  });

  // 4. Hybrid Reciprocal Rank Fusion (RRF)
  const fusedChunks = vectorSearchService.reciprocalRankFusion(denseResults, sparseResults, 60, 5);

  const highestScore = fusedChunks.length > 0 ? (fusedChunks[0].similarityScore || fusedChunks[0].fusedScore || 0) : 0;

// 5. Conditional unhandled query logging (similarity guardrail)
if (highestScore < 0.6) {
  // Low confidence: store as pending and return guardrail response
  try {
    await UnhandledQuery.create({
      queryText: query,
      userId: userId,
      highestSimilarityScore: highestScore,
      status: 'pending',
    });
    console.log(`[RAGService] Unhandled query logged (${highestScore.toFixed(3)}): "${query}"`);
  } catch (logErr) {
    console.error('[RAGService] Failed to log unhandled query:', logErr);
  }
  return {
    text: 'I am sorry, but this information is not available in the college documents.',
    sources: [],
    confidenceScore: highestScore,
  };
}
// Continue with normal processing for high confidence queries

  // 6. Build Context & Sources
  const { contextString, sources } = buildContextAndSources(fusedChunks);

  const prompt = `${SYSTEM_INSTRUCTION}

--- BEGIN RETRIEVED COLLEGE DOCUMENTS CONTEXT ---
${contextString || 'No relevant document context found for this query.'}
--- END RETRIEVED COLLEGE DOCUMENTS CONTEXT ---

Student Query: ${query}

Provide a verified, clear response:`;

  // 7. Invoke Gemini Generative Model (gemini-3.5-flash)
  const model = getGenerativeModel('gemini-3.5-flash');

  let fullResponseText = '';

  try {
    const streamingResult = await model.generateContentStream(prompt);

    for await (const chunk of streamingResult.stream) {
      const textPart = chunk.text();
      fullResponseText += textPart;
      if (onChunk && typeof onChunk === 'function') {
        onChunk(textPart);
      }
    }
  } catch (error) {
    console.error(`[RAGService] Gemini generation error: ${error.message}`);
    const fallbackText = "I am sorry, but I encountered an error retrieving answers from the college documents at this moment. Please check server configuration or try again shortly.";
    if (onChunk) onChunk(fallbackText);
    fullResponseText = fallbackText;
  }

  // 8. Persist conversation message if conversationId or userId exists
  if (conversationId || userId) {
    try {
      let conversation;
      if (conversationId) {
        conversation = await Conversation.findById(conversationId);
      }
      if (!conversation && userId) {
        conversation = await Conversation.create({
          userId,
          title: query.length > 40 ? query.substring(0, 40) + '...' : query,
          departmentFilter,
          messages: [],
        });
      }

      if (conversation) {
        conversation.messages.push({
          sender: 'user',
          text: query,
          timestamp: new Date(),
        });
        conversation.messages.push({
          sender: 'assistant',
          text: fullResponseText,
          sources: sources,
          confidenceScore: highestScore,
          timestamp: new Date(),
        });
        await conversation.save();
      }
    } catch (saveErr) {
      console.warn('[RAGService] Failed to save conversation transcript:', saveErr.message);
    }
  }

  return {
    text: fullResponseText,
    sources,
    confidenceScore: highestScore,
  };
};

module.exports = {
  SYSTEM_INSTRUCTION,
  buildContextAndSources,
  processRagQuery,
};
