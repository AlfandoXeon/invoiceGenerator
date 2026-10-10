const express = require('express');
const router = express.Router();
const HistoryController = require('../controllers/HistoryController');

// Halaman riwayat transaksi
router.get('/history', HistoryController.renderHistoryPage);

// Ekspor riwayat transaksi ke CSV
router.get('/history/export/csv', HistoryController.exportTransactionsCsv);

// API Rincian transaksi
router.get('/api/transactions/:id', HistoryController.getTransactionDetail);

// API Hapus transaksi
router.delete('/api/transactions/:id', HistoryController.deleteTransaction);

// View Cetak Thermal Standalone
router.get('/history/print/:id', HistoryController.renderPrintThermal);

module.exports = router;
