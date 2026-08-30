const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');

// Configure public DNS resolvers to prevent Windows SRV lookup ECONNREFUSED issues on mongodb+srv://
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('[MongoDB] Custom DNS configuration skipped:', dnsErr.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`\x1b[32m[MongoDB] Connected successfully to host: ${conn.connection.host} / database: ${conn.connection.name}\x1b[0m`);
    return conn;
  } catch (error) {
    console.error(`\x1b[31m[MongoDB] Connection error: ${error.message}\x1b[0m`);
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('\x1b[33m[MongoDB Tip] Authentication failed: Please verify your MongoDB Atlas Database Username and Password in server/.env.\x1b[0m');
      console.error('\x1b[33m[MongoDB Tip] Go to MongoDB Atlas -> Security -> Database Access to verify or create your user and reset the password.\x1b[0m');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('querySrv')) {
      console.error('\x1b[33m[MongoDB Tip] DNS/Network error: Ensure your network allows DNS queries to Atlas and your IP is whitelisted in MongoDB Atlas Network Access.\x1b[0m');
    }
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
