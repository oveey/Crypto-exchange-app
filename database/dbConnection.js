const mongoose = require('mongoose');

function getMongoDBUri() {
  const uri = process.env.NODE_ENV === 'dev' ? process.env.MONGODB_URI_DEV : process.env.MONGODB_URI_PROD;

  if (!uri) {
    throw new Error(`MongoDB URI not defined for ${process.env.NODE_ENV.toLowerCase()} environment`);
  }

  return uri;
}

async function dbConnection() {
  const mongoDBUri = getMongoDBUri();

  try {
    await mongoose.connect(mongoDBUri, {});
    console.log('Connected to Azax DB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
}

module.exports = dbConnection;
