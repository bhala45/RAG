const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const Conversation = require('../models/Conversation');
const UnhandledQuery = require('../models/UnhandledQuery');

/**
 * Fetch comprehensive system metrics and telemetry
 */
const getSystemAnalytics = async () => {
  const [
    totalDocuments,
    totalChunks,
    documentsByDepartment,
    unhandledQueriesCount,
    conversations,
  ] = await Promise.all([
    Document.countDocuments(),
    DocumentChunk.countDocuments(),
    Document.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          totalChunks: { $sum: '$totalChunks' },
        },
      },
    ]),
    UnhandledQuery.countDocuments({ status: 'pending_review' }),
    Conversation.find({}).select('messages').lean(),
  ]);

  let totalUserMessages = 0;
  let totalAssistantMessages = 0;
  let totalLikes = 0;
  let totalDislikes = 0;

  conversations.forEach((conv) => {
    (conv.messages || []).forEach((msg) => {
      if (msg.sender === 'user') totalUserMessages++;
      if (msg.sender === 'assistant') {
        totalAssistantMessages++;
        if (msg.feedback === 'like') totalLikes++;
        if (msg.feedback === 'dislike') totalDislikes++;
      }
    });
  });

  return {
    overview: {
      totalDocuments,
      totalChunks,
      totalQueriesAnswered: totalAssistantMessages,
      totalUserInteractions: totalUserMessages,
      unhandledQueriesPending: unhandledQueriesCount,
      satisfactionRate:
        totalLikes + totalDislikes > 0
          ? ((totalLikes / (totalLikes + totalDislikes)) * 100).toFixed(1) + '%'
          : '100%',
    },
    departmentBreakdown: documentsByDepartment,
    feedback: {
      likes: totalLikes,
      dislikes: totalDislikes,
    },
  };
};

module.exports = {
  getSystemAnalytics,
};
