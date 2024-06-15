const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const customError = require('../utilities/customError.js');
const handleCustomErrorResponse = require('../utilities/handleCustomErrorResponse.js');

const checkAuthorization = (req, res, userId) => {
  const { id } = req.params;

  if (!id) {
    throw new customError('User Id is required as API Url parameter', 405);
  }
  if (id !== userId) {
    throw new customError('User unauthorized to perform this action', 401);
  }
};

const getTwoFactorAuthenticationStatus = async (req, res) => {
  const { userId } = req.user;

  try {
    checkAuthorization(req, res, userId);

    const user = await User.findById(userId);
    if (!user) throw new customError('User not found', 404);

    const { isTwoFactorAuthActive } = user._doc.security;

    res.status(200).json({
      status: 'success',
      isTwoFactorAuthActive,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const updateTwoFactorAuthenticationStatus = async (req, res) => {
  const { userId } = req.user;

  const updates = Object.keys(req.body);
  const allowedUpdates = ['isTwoFactorAuthActive'];

  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  try {
    checkAuthorization(req, res, userId);

    if (updates.length === 0 || !isValidOperation) {
      throw new customError('Invalid update field!', 400);
    }

    const user = await User.findById(userId);
    if (!user) throw new customError('User not found', 404);

    updates.forEach((update) => {
      user.security[update] = req.body[update];
    });
    await user.save();

    res.status(200).json({
      status: 'success',
      message: '2FA status updated successfully',
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const changeUserPassword = async (req, res) => {
  const { userId } = req.user;

  const { prevPassword, newPassword } = req.body;

  try {
    checkAuthorization(req, res, userId);

    if (!prevPassword || !newPassword) {
      throw new customError('Previous password & New password fields are required', 400);
    }

    const user = await User.findById(userId);
    if (!user) throw new customError('User not found', 404);

    const isPasswordMatch = await bcrypt.compare(prevPassword, user.password);
    const isPasswordUnchanged = await bcrypt.compare(newPassword, user.password);

    if (!isPasswordMatch) {
      throw new customError('Previous password is incorrect', 401);
    }
    if (isPasswordUnchanged) {
      throw new customError('New password cannot be the same as previous password', 405);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Password updated successfully',
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

module.exports = { getTwoFactorAuthenticationStatus, updateTwoFactorAuthenticationStatus, changeUserPassword };
