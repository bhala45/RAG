const mongoose = require('mongoose');

const sourceReferenceSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
    },
    title: {
      type: String,
      default: '',
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    snippet: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text cannot be empty'],
    },
    sources: [sourceReferenceSchema],
    confidenceScore: {
      type: Number,
      default: 1.0,
    },
    feedback: {
      type: String,
      enum: ['like', 'dislike', 'none'],
      default: 'none',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
    },
    departmentFilter: {
      type: String,
      default: 'All',
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
