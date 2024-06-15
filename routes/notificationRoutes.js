const express = require('express');
const {
  getNotificationStatusController,
  updateNotificationStatusController,
} = require('../controllers/notifications.js');
const { authenticateUser } = require('../middlewares/authenticateUser.js');

const router = new express.Router();

router.get('/:userId', authenticateUser, getNotificationStatusController);
router.put('/update/:userId', authenticateUser, updateNotificationStatusController);

module.exports = { notificationRoutes: router };
