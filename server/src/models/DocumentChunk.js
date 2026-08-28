const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: [true, 'Document reference is required'],
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: [true, 'Chunk index is required'],
    },
    content: {
      type: String,
      required: [true, 'Chunk content is required'],
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    metadata: {
      department: {
        type: String,
        default: 'General',
      },
      documentTitle: {
        type: String,
        default: '',
      },
      category: {
        type: String,
        default: 'General',
      },
    },
    embedding: {
      type: [Number], // 768-dimensional float array for Gemini text-embedding-004
      required: [true, 'Vector embedding is required'],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'Embedding must be a non-empty array of numbers',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast filtering
documentChunkSchema.index({ 'metadata.department': 1 });
documentChunkSchema.index({ documentId: 1, chunkIndex: 1 });

// Full text index on content for Sparse Keyword Retrieval in Hybrid Search
documentChunkSchema.index({ content: 'text', 'metadata.documentTitle': 'text' });

const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);

module.exports = DocumentChunk;
