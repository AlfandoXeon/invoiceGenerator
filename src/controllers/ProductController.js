const BaseController = require('./BaseController');
const Product = require('../models/Product');
const StoreConfig = require('../models/StoreConfig');

/**
 * ProductController - Mengelola katalog barang toko UMKM
 */
class ProductController extends BaseController {
  constructor() {
    super();
    this.renderProductsPage = this.renderProductsPage.bind(this);
    this.getApiProducts = this.getApiProducts.bind(this);
    this.createProduct = this.createProduct.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
  }

  /**
   * Menampilkan halaman kelola produk
   */
  async renderProductsPage(req, res) {
    try {
      const config = await StoreConfig.get();
      const products = await Product.getAll();
      
      // Ambil daftar kategori unik
      const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

      res.render('pages/products', {
        title: 'Kelola Katalog Produk - Xeon Invoice Generator',
        page: 'products',
        config,
        products,
        categories,
        formatRupiah: this.formatRupiah
      });
    } catch (error) {
      console.error('[ProductController] Error renderProductsPage:', error);
      res.status(500).send('Gagal memuat produk: ' + error.message);
    }
  }

  /**
   * API: Mengambil daftar produk (mendukung query ?q=)
   */
  async getApiProducts(req, res) {
    try {
      const query = req.query.q || '';
      const barcode = req.query.barcode;

      if (barcode) {
        const item = await Product.getByBarcode(barcode);
        return this.sendSuccess(res, item);
      }

      const products = await Product.search(query);
      return this.sendSuccess(res, products);
    } catch (error) {
      return this.sendError(res, error.message);
    }
  }

  /**
   * API: Menambah produk baru
   */
  async createProduct(req, res) {
    try {
      const { barcode, name, category, costPrice, sellingPrice, unit, stock } = req.body;
      if (!name) {
        return this.sendError(res, 'Nama produk wajib diisi', 400);
      }

      const created = await Product.create({
        barcode,
        name,
        category,
        costPrice,
        sellingPrice,
        unit,
        stock
      });

      return this.sendSuccess(res, created, 'Produk berhasil ditambahkan', 201);
    } catch (error) {
      return this.sendError(res, 'Gagal menambah produk: ' + error.message);
    }
  }

  /**
   * API: Memperbarui produk
   */
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updated = await Product.update(id, req.body);
      if (!updated) {
        return this.sendError(res, 'Produk tidak ditemukan', 404);
      }

      return this.sendSuccess(res, updated, 'Produk berhasil diperbarui');
    } catch (error) {
      return this.sendError(res, 'Gagal update produk: ' + error.message);
    }
  }

  /**
   * API: Menghapus produk
   */
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const success = await Product.delete(id);
      if (!success) {
        return this.sendError(res, 'Produk tidak ditemukan', 404);
      }

      return this.sendSuccess(res, null, 'Produk berhasil dihapus');
    } catch (error) {
      return this.sendError(res, 'Gagal menghapus produk: ' + error.message);
    }
  }
}

module.exports = new ProductController();
