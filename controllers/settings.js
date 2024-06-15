const User = require('../models/User.js');
const customError = require('../utilities/customError.js');
const handleCustomErrorResponse = require('../utilities/handleCustomErrorResponse.js');

const getUserSettings = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  try {
    if (!id) {
      throw new customError('User Id is required as API Url paramter', 405);
    }
    if (id !== userId) {
      throw new customError('User unauthorized to fetch resource', 401);
    }

    const user = await User.findById(id);
    if (!user) throw new customError('User not found', 404);

    res.status(200).json({
      status: 'success',
      settings: user.settings,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const updateUserSettings = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  const updates = Object.keys(req.body);
  const allowedUpdates = ['receiveWeeklyNewsletter', 'optInForSMSNotification', 'language'];

  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  try {
    if (!id) {
      throw new customError('User Id is required as API Url paramter', 405);
    }
    if (id !== userId) {
      throw new customError('User unauthorized to update resource', 401);
    }

    if (updates.length === 0 || !isValidOperation) {
      throw new customError('Invalid update field!', 400);
    }

    const user = await User.findById(id);
    if (!user) throw new customError('User not found', 404);

    updates.forEach((update) => {
      user.settings[update] = req.body[update];
    });
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Settings updated successfully',
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

module.exports = { getUserSettings, updateUserSettings };
