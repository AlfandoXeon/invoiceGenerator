const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');

// Halaman kelola produk
router.get('/products', ProductController.renderProductsPage);

// API Kelola Produk
router.get('/api/products', ProductController.getApiProducts);
router.post('/api/products', ProductController.createProduct);
router.put('/api/products/:id', ProductController.updateProduct);
router.delete('/api/products/:id', ProductController.deleteProduct);

module.exports = router;
