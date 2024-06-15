const express = require('express');
const { authenticateUser } = require('../middlewares/authenticateUser.js');
const verificationParamsConfig = require('../middlewares/verificationParamsConfig.js');
const {
  fetchAllSupportedCountriesController,
  verifyCustomerDetailsController,
} = require('../controllers/customerVerification.js');

const router = new express.Router();

router.get('/getSupportedCountries', fetchAllSupportedCountriesController);
router.post('/verify/:userId', authenticateUser, verificationParamsConfig, verifyCustomerDetailsController);

module.exports = { customerVerificationRoutes: router };
