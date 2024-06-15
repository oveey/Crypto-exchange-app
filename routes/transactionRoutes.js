const express = require('express');
const { authenticateUser } = require('../middlewares/authenticateUser.js');
const { depositFiatController, withdrawFiatController } = require('../controllers/fiatTransactions.js');

const router = new express.Router();

router.post('/depositFiat/:userId', authenticateUser, depositFiatController);
router.post('/withdrawFiat/:userId', authenticateUser, withdrawFiatController);

module.exports = { transactionRoutes: router };
