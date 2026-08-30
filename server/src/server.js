const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const startServer = async () => {
  // 1. Connect to Database
  await connectDB();

  // 2. Start HTTP Server
  const server = app.listen(env.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 CampusWise AI Backend Server running in [${env.NODE_ENV}] mode`);
    console.log(`📡 URL: http://localhost:${env.PORT}`);
    console.log(`🔍 Health: http://localhost:${env.PORT}/api/health`);
    console.log(`🤖 Gemini AI Models: gemini-embedding-001 (768-dim) + gemini-3.5-flash`);
    console.log(`======================================================\n`);
  });

  // Graceful shutdown
  const handleShutdown = (signal) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('[FATAL] Error starting CampusWise AI Server:', err);
  process.exit(1);
});
