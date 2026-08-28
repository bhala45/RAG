const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const pdfService = require('../services/pdfService');
const chunkingService = require('../services/chunkingService');
const embeddingService = require('../services/embeddingService');

/**
 * @desc    Upload, parse, chunk, embed, and index a document (PDF/TXT)
 * @route   POST /api/documents/upload
 * @access  Private (Admin only)
 */
const uploadDocument = async (req, res, next) => {
  let createdDoc = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a PDF or document file.',
      });
    }

    const { title, department = 'General' } = req.body;
    const documentTitle = title || req.file.originalname.replace(/\.[^/.]+$/, '');

    // 1. Create document record with status: 'processing'
    createdDoc = await Document.create({
      title: documentTitle,
      fileName: req.file.originalname,
      department: department,
      fileType: req.file.originalname.endsWith('.txt') ? 'txt' : 'pdf',
      uploadedBy: req.user ? req.user._id : null,
      status: 'processing',
      totalChunks: 0,
    });

    console.log(`[DocumentController] Processing document "${createdDoc.title}" (ID: ${createdDoc._id})...`);

    // 2. Extract text and page mapping
    let pages = [];
    if (req.file.mimetype === 'text/plain' || req.file.originalname.endsWith('.txt')) {
      const textContent = req.file.buffer.toString('utf-8');
      pages = [{ pageNumber: 1, text: pdfService.cleanText(textContent) }];
    } else {
      const extraction = await pdfService.extractTextFromPDF(req.file.buffer);
      pages = extraction.pages;
    }

    if (!pages || pages.length === 0 || pages.every((p) => !p.text || p.text.trim().length === 0)) {
      createdDoc.status = 'failed';
      await createdDoc.save();
      return res.status(400).json({
        success: false,
        error: 'Could not extract readable text from the document. The document may be scanned or empty.',
      });
    }

    // 3. Chunk text into ~500 token segments with 50 token overlap
    const chunks = await chunkingService.chunkDocumentPages(pages, {
      department: createdDoc.department,
      documentTitle: createdDoc.title,
      category: createdDoc.department,
    });

    if (chunks.length === 0) {
      createdDoc.status = 'failed';
      await createdDoc.save();
      return res.status(400).json({
        success: false,
        error: 'Document produced 0 valid text chunks.',
      });
    }

    console.log(`[DocumentController] Generated ${chunks.length} chunks. Generating Gemini vector embeddings...`);

    // 4. Generate 768-dim embeddings using Gemini text-embedding-004
    const embeddings = await embeddingService.embedChunks(chunks);

    // 5. Bulk insert document chunks into MongoDB
    const chunkDocuments = chunks.map((chunk, index) => ({
      documentId: createdDoc._id,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      pageNumber: chunk.pageNumber,
      metadata: chunk.metadata,
      embedding: embeddings[index],
    }));

    await DocumentChunk.insertMany(chunkDocuments);

    // 6. Update document status to 'indexed'
    createdDoc.totalChunks = chunks.length;
    createdDoc.status = 'indexed';
    await createdDoc.save();

    console.log(`\x1b[32m[DocumentController] Successfully indexed "${createdDoc.title}" with ${chunks.length} vector chunks.\x1b[0m`);

    res.status(201).json({
      success: true,
      message: 'Document uploaded, chunked, and vector-indexed successfully.',
      data: {
        document: createdDoc,
        totalChunks: chunks.length,
      },
    });
  } catch (error) {
    if (createdDoc) {
      createdDoc.status = 'failed';
      await createdDoc.save().catch(() => {});
    }
    next(error);
  }
};

/**
 * @desc    Get all documents with filtering & pagination
 * @route   GET /api/documents
 * @access  Private / Public
 */
const getDocuments = async (req, res, next) => {
  try {
    const { department, status, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (department && department !== 'All') {
      filter.department = department;
    }
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [documents, total] = await Promise.all([
      Document.find(filter)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Document.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        documents,
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
 * @desc    Get all chunks for a specific document (for Admin inspection & verification)
 * @route   GET /api/documents/:id/chunks
 * @access  Private (Admin only)
 */
const getDocumentChunks = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found.',
      });
    }

    const chunks = await DocumentChunk.find({ documentId: id })
      .sort({ chunkIndex: 1 });

    // Format chunk items with embedding dimensions and preview
    const formattedChunks = chunks.map((chunk) => ({
      _id: chunk._id,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      pageNumber: chunk.pageNumber,
      metadata: chunk.metadata,
      embeddingDimensions: chunk.embedding ? chunk.embedding.length : 0,
      embeddingPreview: chunk.embedding ? chunk.embedding.slice(0, 5) : [],
      createdAt: chunk.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        document,
        totalChunks: formattedChunks.length,
        chunks: formattedChunks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete document and all associated chunks
 * @route   DELETE /api/documents/:id
 * @access  Private (Admin only)
 */
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found.',
      });
    }

    // Delete chunks associated with this document
    const deleteChunksResult = await DocumentChunk.deleteMany({ documentId: id });
    await Document.findByIdAndDelete(id);

    console.log(`[DocumentController] Deleted document "${document.title}" and ${deleteChunksResult.deletedCount} chunks.`);

    res.status(200).json({
      success: true,
      message: `Document "${document.title}" and ${deleteChunksResult.deletedCount} chunks deleted successfully.`,
      data: {
        deletedDocumentId: id,
        deletedChunksCount: deleteChunksResult.deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentChunks,
  deleteDocument,
};
