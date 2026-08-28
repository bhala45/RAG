const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

/**
 * Split text pages into semantic chunks of ~500 tokens (approx 1500-2000 characters) with 50-token overlap
 * @param {Array<{ pageNumber: number, text: string }>} pages
 * @param {Object} metadata - { department, documentTitle, category }
 * @returns {Promise<Array<{ chunkIndex: number, content: string, pageNumber: number, metadata: Object }>>}
 */
const chunkDocumentPages = async (pages, metadata = {}) => {
  // Configure RecursiveCharacterTextSplitter
  // ~500 tokens is roughly 1800 characters (avg 3.5 - 4 chars per token)
  // 50 tokens overlap is roughly 200 characters
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1800,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' ', ''],
  });

  const chunks = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    if (!page.text || page.text.trim().length === 0) {
      continue;
    }

    // Split page text into smaller chunk segments
    const splitTexts = await splitter.splitText(page.text);

    for (const chunkText of splitTexts) {
      const trimmed = chunkText.trim();
      // Only keep meaningful chunks (> 20 characters)
      if (trimmed.length > 20) {
        chunks.push({
          chunkIndex: globalChunkIndex++,
          content: trimmed,
          pageNumber: page.pageNumber,
          metadata: {
            department: metadata.department || 'General',
            documentTitle: metadata.documentTitle || 'Untitled Document',
            category: metadata.category || metadata.department || 'General',
          },
        });
      }
    }
  }

  return chunks;
};

module.exports = {
  chunkDocumentPages,
};
