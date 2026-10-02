const express = require('express');
const router = express.Router();
const multer = require('multer');
const SettingsController = require('../controllers/SettingsController');

const uploadZip = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // Batas ukuran 50 MB
});

router.get('/settings', SettingsController.renderSettingsPage);
router.post('/settings', SettingsController.updateSettings);
router.get('/settings/backup', SettingsController.backupDatabase);
router.post('/settings/restore', uploadZip.single('backupZip'), SettingsController.restoreDatabase);

module.exports = router;
