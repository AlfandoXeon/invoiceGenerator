const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const ConfigController = require('../controllers/ConfigController');

// Setup direktori upload logo
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer untuk upload gambar logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `store-logo-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // Max 3MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Hanya file gambar (PNG, JPG, WEBP, SVG) yang diperbolehkan!'));
  }
});

// Halaman pengaturan toko owner
router.get('/config', ConfigController.renderConfigPage);

// Simpan konfigurasi
router.post('/config', ConfigController.updateConfig);

// Upload logo toko
router.post('/config/logo', upload.single('logo'), ConfigController.uploadLogo);

module.exports = router;
