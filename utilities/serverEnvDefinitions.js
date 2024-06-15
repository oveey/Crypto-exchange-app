require('dotenv').config();

let imageServerUrl;
let imageServerEnvString;

if (process.env.IMG_SERVER_ENV === 'dev') {
  imageServerUrl = process.env.DEV_SERVER_URL;
  imageServerEnvString = 'Development';
} else {
  imageServerUrl = process.env.PROD_SERVER_URL;
  imageServerEnvString = 'Production';
}

module.exports = { imageServerUrl, imageServerEnvString };
