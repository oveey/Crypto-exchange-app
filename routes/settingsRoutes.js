const express = require('express');
const { getUserSettings, updateUserSettings } = require('../controllers/settings.js');
const { authenticateUser } = require('../middlewares/authenticateUser.js');

const router = new express.Router();

router.get('/:id', authenticateUser, getUserSettings);
router.put('/:id', authenticateUser, updateUserSettings);

module.exports = { settingsRoutes: router };
