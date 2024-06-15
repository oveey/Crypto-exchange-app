const express = require('express');
const { authenticateUser } = require('../middlewares/authenticateUser.js');
const {
  getTwoFactorAuthenticationStatus,
  updateTwoFactorAuthenticationStatus,
  changeUserPassword,
} = require('../controllers/security.js');

const router = new express.Router();

router.get('/twoFactorAuth/:id', authenticateUser, getTwoFactorAuthenticationStatus);
router.put('/twoFactorAuth/:id', authenticateUser, updateTwoFactorAuthenticationStatus);
router.put('/changePassword/:id', authenticateUser, changeUserPassword);

module.exports = { securityRoutes: router };
