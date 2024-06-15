const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const User = require('../models/User.js');
const DeletedUser = require('../models/DeletedUser.js');
const customError = require('../utilities/customError.js');
const handleCustomErrorResponse = require('../utilities/handleCustomErrorResponse.js');
const { includedProperties, selectedResponseKeys } = require('../utilities/selectedResponseKeys.js');
const { imageServerUrl, imageServerEnvString } = require('../utilities/serverEnvDefinitions.js');

const getUserInfoController = async (req, res) => {
  const id = req.user.userId;
  const { userId } = req.params;

  try {
    if (!userId) {
      throw new customError('User Id is required', 405);
    }

    if (userId !== id) {
      throw new customError('User unauthorized to get resource', 401);
    }

    const user = await User.findById(id);

    if (!user) throw new customError('User not found', 404);

    const profileKeyValuePairs = selectedResponseKeys(user._doc, includedProperties);

    let imageUrl = user.imageUrl;
    let imageLink;

    const isDefaultImage = imageUrl === 'https://i.postimg.cc/hj3g9nRG/profile-avatar.png';

    if (!isDefaultImage) {
      const imagePath = path.join(__dirname, '..', 'uploads', imageUrl);

      if (fs.existsSync(imagePath)) {
        const imageFile = fs.readFileSync(imagePath);
        imageLink = `data:image/png;base64,${Buffer.from(imageFile).toString('base64')}`;
      } else {
        imageLink = `File not available in ${imageServerEnvString}`;
      }
    }

    return res.status(200).json({
      status: 'success',
      profile: {
        ...profileKeyValuePairs,
        imageUrl: isDefaultImage ? imageUrl : `${imageServerUrl}/${imageUrl}`,
        // imageLink,
      },
    });
  } catch (error) {
    console.error(error);
    handleCustomErrorResponse(res, error);
  }
};

/**
 * The allowedUpdates array is subject to modification & should be exposed only to Admins
 */
const updateUserInfoController = async (req, res) => {
  const id = req.user.userId;
  const { userId } = req.params;

  const { ...updateObj } = req.body;
  const updateKeysArr = Object.keys(req.body);

  const allowedUpdates = ['username', 'firstName', 'lastName', 'email', 'phoneNumber'];
  const isValidOperation = updateKeysArr.every((update) => allowedUpdates.includes(update));

  try {
    if (!userId) {
      throw new customError('User Id is required', 405);
    }

    if (userId !== id) {
      throw new customError('User unauthorized to update resource', 401);
    }

    if (!isValidOperation) {
      throw new customError('Invalid updates!', 403);
    }

    const filteredUpdateObj = {};
    updateKeysArr.forEach((update) => {
      if (updateObj[update] !== undefined) {
        filteredUpdateObj[update] = updateObj[update];
      }
    });

    const user = await User.findByIdAndUpdate(id, filteredUpdateObj, {
      new: true,
      runValidators: true,
    });

    if (!user) throw new customError('User not found', 404);

    const { password, createdAt, updatedAt, __v, ...otherCredentials } = user._doc;

    return res.status(200).json({
      status: 'success',
      updatedUser: otherCredentials,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

const updateProfileImageController = async (req, res) => {
  const id = req.user.userId;
  const { userId } = req.params;

  try {
    if (!userId) {
      throw new customError('User Id is required', 405);
    }

    if (userId !== id) {
      throw new customError('User unauthorized to update resource', 401);
    }

    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        throw new customError('Error parsing form data', 500);
      }

      const { image } = files;

      if (!image || !image.length) {
        return res.status(403).json({ message: 'Image file is required' });
      }

      const { filepath: tempPath, originalFilename: imageName, size: imageSize } = image[0];

      const maxSize = 700 * 1024;
      if (imageSize > maxSize) {
        return res.status(400).json({
          status: 'failure',
          message: 'Image file cannot be more than 700KB',
        });
      }

      const newPath = path.join(__dirname, '..', 'uploads', imageName);

      // Move the uploaded image to a permanent location
      fs.copyFile(tempPath, newPath, async (err) => {
        if (err) {
          return res.status(500).json({ message: `Error saving image: ${err.message}` });
        }

        // Delete the temporary file
        fs.unlink(tempPath, async (err) => {
          if (err) {
            return res.status(500).json({ message: `Error saving image ${err.message}` });
          }

          // Update user's image URL in the database
          const imageUrl = `${imageName}`;
          const user = await User.findByIdAndUpdate(id, { imageUrl }, { new: true, runValidators: true });

          if (!user) {
            return res.status(404).json({
              status: 'failure',
              message: 'User not found',
            });
          }

          return res.status(200).json({
            status: 'success',
            message: 'Image updated successfully!',
          });
        });
      });
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

// TODO: Handle Errors appropriately here
const fetchProfileImageController = (req, res) => {
  const { imageUrl } = req.params;

  const imagePath = path.join(__dirname, '..', 'uploads', imageUrl);

  // Serve the image file
  res.sendFile(imagePath);
};

// This controller intends to disable & not to completely delete
const deleteUserAccountController = async (req, res, next) => {
  const id = req.user.userId;
  const { userId } = req.params;

  try {
    if (!userId) {
      throw new customError('User Id is required as API url parameter', 405);
    }
    if (userId !== id) {
      throw new customError('User unauthorized to perform this action', 401);
    }

    const userToBeDeleted = await User.findOneAndDelete({
      _id: userId,
    });
    if (!userToBeDeleted) {
      throw new customError('User not found', 404);
    }

    const { _id: accId, email, username, firstName, lastName, ...otherCredentials } = userToBeDeleted._doc;

    const deletedUserObj = {
      accId,
      email,
      username,
      fullName: `${lastName} ${firstName}`,
    };

    const deletedUser = await DeletedUser.create(deletedUserObj);
    if (!deletedUser) {
      throw new customError('Deleted user information not trashed successfully', 404);
    }

    return res.status(200).json({
      status: 'success',
      deletedUser,
    });
  } catch (error) {
    handleCustomErrorResponse(res, error);
  }
};

module.exports = {
  getUserInfoController,
  updateUserInfoController,
  updateProfileImageController,
  fetchProfileImageController,
  deleteUserAccountController,
};
