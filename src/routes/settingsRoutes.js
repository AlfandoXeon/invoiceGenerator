const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');

router.get('/settings', SettingsController.renderSettingsPage);
router.post('/settings', SettingsController.updateSettings);
router.get('/settings/backup', SettingsController.backupDatabase);

module.exports = router;
