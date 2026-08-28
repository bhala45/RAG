const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
    });

    console.log(`\x1b[32m[MongoDB] Connected successfully to host: ${conn.connection.host} / database: ${conn.connection.name}\x1b[0m`);
    return conn;
  } catch (error) {
    console.error(`\x1b[31m[MongoDB] Connection error: ${error.message}\x1b[0m`);
    if (env.isProduction) {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('\x1b[33m[MongoDB] Disconnected from database\x1b[0m');
});

mongoose.connection.on('reconnected', () => {
  console.log('\x1b[32m[MongoDB] Reconnected to database\x1b[0m');
});

module.exports = connectDB;
