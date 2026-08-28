const express = require('express');
const documentController = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Upload document (Admin only)
router.post(
  '/upload',
  protect,
  authorize('admin'),
  upload.single('file'),
  documentController.uploadDocument
);

// Get list of documents (Accessible to authenticated users)
router.get('/', protect, documentController.getDocuments);

// Inspect document chunks (Admin only)
router.get('/:id/chunks', protect, authorize('admin'), documentController.getDocumentChunks);

// Delete document and chunks (Admin only)
router.delete('/:id', protect, authorize('admin'), documentController.deleteDocument);

module.exports = router;
