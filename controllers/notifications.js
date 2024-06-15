const User = require('../models/User.js');
const customError = require('../utilities/customError.js');
const handleCustomErrorResponse = require('../utilities/handleCustomErrorResponse.js');

const updateNotificationStatusController = async (req, res, next) => {
  const id = req.user.userId;
  const { userId } = req.params;
  const { notificationStatus } = req.body;

  try {
    if (!userId) {
      throw new customError('User Id is required', 405);
    }

    if (userId !== id) {
      throw new customError('User unauthorized to update resource', 401);
    }

    if (typeof notificationStatus !== 'boolean') {
      throw new customError('Notification status must be a boolean value', 405);
    }

    const user = await User.findByIdAndUpdate(id, { notificationStatus }, { new: true });

    if (!user) throw new customError('User not found', 404);

    return res.status(200).json({
      status: 'success',
      message: 'Notification status updated successfully',
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const getNotificationStatusController = async (req, res, next) => {
  const id = req.user.userId;
  const { userId } = req.params;

  try {
    if (!userId) {
      throw new customError('User Id is required', 405);
    }

    if (userId !== id) {
      throw new customError('User unauthorized to update resource', 401);
    }

    const user = await User.findById(id);

    if (!user) throw new customError('User not found', 404);

    return res.status(200).json({
      status: 'success',
      notificationStatus: user.notificationStatus,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

module.exports = { updateNotificationStatusController, getNotificationStatusController };
