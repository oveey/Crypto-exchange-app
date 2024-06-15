const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
// const EmailVerifier = require('email-verifier');
const User = require('../models/User.js');
const customError = require('../utilities/customError.js');
const emailService = require('../utilities/sendEmail.js');
const handleCustomErrorResponse = require('../utilities/handleCustomErrorResponse.js');

const generateOTP = () => Math.floor(1000 + Math.random() * 9000);

/** KEYNOTES:
 *
 * The email address should be converted to lowercase by Favour before being POSTED
 * The verification emails should be sent in a well structured html format
 *
 */

const registerUserController = async (req, res, next) => {
  const { username, email, password, ...otherCredentials } = req.body;

  try {
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new customError('User already exists!', 403);
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const emailOtp = generateOTP().toString();

    const user = new User({
      firstName: otherCredentials.firstName,
      lastName: otherCredentials.lastName,
      username,
      email,
      password: hashedPassword,
      emailOtp,
    });

    await emailService.sendVerificationEmail(email, `Your email verification OTP is ${emailOtp}`);

    await user.save();

    return res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      otp: emailOtp,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const sendEmailOtpController = async (req, res, next, isForgotPasswordOtp) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new customError('User not found', 404);
    }

    if (!isForgotPasswordOtp && user.isEmailVerified) {
      throw new customError('Email already verified', 200);
    }

    const newEmailOtp = generateOTP().toString();

    user.emailOtp = newEmailOtp;

    const prependedText = isForgotPasswordOtp ? 'forgot password' : 'email verification';

    await emailService.sendVerificationEmail(email, `Your new ${prependedText} OTP is ${newEmailOtp}`);

    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Email OTP resent successfully',
      otp: newEmailOtp,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const resendEmailOtpController = (req, res, next) => {
  const isResendForgotPasswordOtp = false;

  sendEmailOtpController(req, res, next, isResendForgotPasswordOtp);
};

/**
 *
 * Ensure that favour does a countdown of 1:30 minutes after which he disables the button that types in OTP
 * ::and shows an error of 'OTP Expired, Resend verification OTP'
 *
 */
const verifyEmailOtpController = async (req, res, next) => {
  const { email, emailOtp } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      throw new customError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new customError('Email already verified', 409);
    }

    if (user.emailOtp !== emailOtp) {
      throw new customError('Invalid OTP', 403);
    }

    user.isEmailVerified = true;
    user.emailOtp = undefined;

    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const loginUserController = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) throw new customError('User not found', 404);

    if (!user.isEmailVerified) throw new customError('Email account unverified. Cannot login', 434);

    const passwordMatch = await bcrypt.compareSync(password, user.password);

    if (passwordMatch) {
      const token = jwt.sign(
        {
          user: {
            userId: user._id.toString(),
          },
        },
        process.env.SECRET_TOKEN,
        {
          expiresIn: '7d',
        }
      );

      return res.status(200).json({
        status: 'success',
        token,
        message: 'Login successful',
      });
    } else {
      throw new customError('Incorrect password', 401);
    }
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const forgotPasswordController = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new customError('User not found with this email', 404);
    }

    const forgotPasswordOtp = generateOTP().toString();
    user.emailOtp = forgotPasswordOtp;

    await user.save();

    await emailService.sendVerificationEmail(email, `Your Password Reset OTP is: ${forgotPasswordOtp}`);

    res.status(200).json({
      status: 'success',
      message: 'Reset OTP sent to your email',
      forgotPasswordOtp,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const resendForgotPasswordOtpController = (req, res, next) => {
  const isResendForgotPasswordOtp = true;

  sendEmailOtpController(req, res, next, isResendForgotPasswordOtp);
};

const resetPasswordController = async (req, res) => {
  const { email, newPassword, resetPasswordOtp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new customError('User not found with this email', 404);
    }

    const isOTPMatch = user.emailOtp === resetPasswordOtp;

    if (!isOTPMatch) throw new customError('OTP is incorrect', 400);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.emailOtp = undefined;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful',
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

module.exports = {
  registerUserController,
  resendEmailOtpController,
  verifyEmailOtpController,
  loginUserController,
  forgotPasswordController,
  resendForgotPasswordOtpController,
  resetPasswordController,
};
