const express = require('express');
const {
  registerUserController,
  resendEmailOtpController,
  verifyEmailOtpController,
  loginUserController,
  forgotPasswordController,
  resetPasswordController,
  resendForgotPasswordOtpController,
} = require('../controllers/auths.js');

const router = express.Router();

router.post('/registerUser', registerUserController);
router.post('/loginUser', loginUserController);
router.post('/resendEmailVerificationOtp', resendEmailOtpController);
router.post('/verifyEmailOtp', verifyEmailOtpController);
router.post('/sendforgotPasswordOtp', forgotPasswordController);
router.post('/resendForgotPasswordOtp', resendForgotPasswordOtpController);
router.post('/resetPassword', resetPasswordController);

module.exports = { authRoutes: router };
