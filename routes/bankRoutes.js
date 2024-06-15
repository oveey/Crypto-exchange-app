const express = require('express');
const {
  getSupportedBanksController,
  getBankDetailsController,
  updateBankDetailsController,
  verifyBankAccountController,
} = require('../controllers/banks.js');
const { authenticateUser } = require('../middlewares/authenticateUser.js');

const router = new express.Router();

router.get('/supported', getSupportedBanksController);
router.get('/:userId', authenticateUser, getBankDetailsController);
router.put('/updateDetails/:userId', authenticateUser, updateBankDetailsController);
router.post('/verifyDetails', authenticateUser, verifyBankAccountController);

module.exports = { bankRoutes: router };
