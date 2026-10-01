const express = require('express');
const router = express.Router();
const GuideController = require('../controllers/GuideController');

// Halaman panduan penggunaan
router.get('/guide', GuideController.renderGuidePage);

module.exports = router;
