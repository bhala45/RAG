const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a document title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      enum: {
        values: ['General', 'CSE', 'ECE', 'Mechanical', 'Admissions', 'Hostel', 'Placements'],
        message: '{VALUE} is not a supported department',
      },
      default: 'General',
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'txt'],
      default: 'pdf',
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    status: {
      type: String,
      enum: {
        values: ['processing', 'indexed', 'failed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'processing',
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ department: 1, status: 1 });
documentSchema.index({ createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
