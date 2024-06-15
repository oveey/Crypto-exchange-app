const express = require('express');
const {
  getUserInfoController,
  updateUserInfoController,
  updateProfileImageController,
  fetchProfileImageController,
  deleteUserAccountController,
} = require('../controllers/users.js');
const { authenticateUser } = require('../middlewares/authenticateUser.js');

const router = new express.Router();

router.get('/:userId', authenticateUser, getUserInfoController);
router.put('/:userId', authenticateUser, updateUserInfoController);
router.delete('/:userId', authenticateUser, deleteUserAccountController);
router.put('/image/:userId', authenticateUser, updateProfileImageController);
router.get('/image/:imageUrl', fetchProfileImageController);

module.exports = { userRoutes: router };
