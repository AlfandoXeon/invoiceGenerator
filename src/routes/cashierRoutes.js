const express = require('express');
const router = express.Router();
const CashierController = require('../controllers/CashierController');

// Halaman utama kasir
router.get('/', CashierController.renderCashierPage);

// API Checkout & pembuatan faktur
router.post('/api/checkout', CashierController.processCheckout);

// API Generator nomor invoice berikutnya
router.get('/api/next-invoice', CashierController.getNextInvoiceNumber);

module.exports = router;
