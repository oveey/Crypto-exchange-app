require('dotenv').config();

function configureServerUrl() {
  const uri = process.env.IMG_SERVER_ENV === 'dev' ? process.env.SERVER_URL_DEV : process.env.SERVER_URL_PROD;

  if (!uri) {
    throw new Error(`MongoDB URI not defined for ${process.env.NODE_ENV.toLowerCase()} environment`);
  }

  return { uri };
}

module.exports = configureServerUrl;
