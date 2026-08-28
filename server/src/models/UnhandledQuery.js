const mongoose = require('mongoose');

const unhandledQuerySchema = new mongoose.Schema(
  {
    queryText: {
      type: String,
      required: [true, 'Query text is required'],
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    highestSimilarityScore: {
      type: Number,
      default: 0.0,
    },
    status: {
      type: String,
      enum: {
        values: ['pending_review', 'resolved', 'ignored'],
        message: '{VALUE} is not a valid query status',
      },
      default: 'pending_review',
    },
  },
  {
    timestamps: true,
  }
);

unhandledQuerySchema.index({ status: 1, createdAt: -1 });

const UnhandledQuery = mongoose.model('UnhandledQuery', unhandledQuerySchema);

module.exports = UnhandledQuery;
