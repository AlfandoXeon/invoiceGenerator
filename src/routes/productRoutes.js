const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');

// Halaman kelola produk
router.get('/products', ProductController.renderProductsPage);

// Ekspor katalog produk ke CSV
router.get('/products/export/csv', ProductController.exportProductsCsv);

// API Kelola Produk
router.get('/api/products', ProductController.getApiProducts);
router.post('/api/products', ProductController.createProduct);
router.put('/api/products/:id', ProductController.updateProduct);
router.delete('/api/products/:id', ProductController.deleteProduct);

// API Restock barang masuk
router.post('/api/products/:id/restock', ProductController.restockProduct);
router.post('/api/products/restock', ProductController.restockProduct);

module.exports = router;
