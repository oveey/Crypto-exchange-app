const { authRoutes } = require('./authRoutes.js');
const { userRoutes } = require('./userRoutes.js');
const { bankRoutes } = require('./bankRoutes.js');
const { notificationRoutes } = require('./notificationRoutes.js');
const { customerVerificationRoutes } = require('./customerVerificationRoutes.js');
const { settingsRoutes } = require('./settingsRoutes.js');
const { securityRoutes } = require('./securityRoutes.js');
const { transactionRoutes } = require('./transactionRoutes.js');

module.exports = {
  authRoutes,
  userRoutes,
  bankRoutes,
  notificationRoutes,
  customerVerificationRoutes,
  settingsRoutes,
  securityRoutes,
  transactionRoutes,
};
