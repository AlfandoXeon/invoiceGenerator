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
    this.restockProduct = this.restockProduct.bind(this);
    this.exportProductsCsv = this.exportProductsCsv.bind(this);
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

  /**
   * Helper format escape cell CSV
   */
  escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * API: Menambah stok barang masuk (Restock)
   */
  async restockProduct(req, res) {
    try {
      const id = req.params.id || req.body.id;
      const { qty, costPrice } = req.body;

      if (!id) {
        return this.sendError(res, 'ID produk wajib disertakan', 400);
      }

      const numQty = parseInt(qty, 10);
      if (isNaN(numQty) || numQty <= 0) {
        return this.sendError(res, 'Jumlah barang masuk harus lebih dari 0', 400);
      }

      const updated = await Product.restock(id, numQty, costPrice);
      if (!updated) {
        return this.sendError(res, 'Produk tidak ditemukan', 404);
      }

      return this.sendSuccess(res, updated, `Berhasil menambah stok "${updated.name}" sebanyak ${numQty} ${updated.unit || 'Pcs'}`);
    } catch (error) {
      return this.sendError(res, 'Gagal restock produk: ' + error.message);
    }
  }

  /**
   * Ekspor data katalog produk ke format CSV
   */
  async exportProductsCsv(req, res) {
    try {
      const products = await Product.getAll();
      const dateStr = new Date().toISOString().slice(0, 10);

      const headers = [
        'ID Produk',
        'Barcode / Kode',
        'Nama Produk',
        'Kategori',
        'Harga Modal (Rp)',
        'Harga Jual (Rp)',
        'Margin Laba (Rp)',
        'Margin Laba (%)',
        'Stok Saat Ini',
        'Satuan',
        'Total Nilai Aset Modal (Rp)',
        'Terakhir Diperbarui'
      ];

      const rows = products.map(p => {
        const cost = p.costPrice || 0;
        const sell = p.sellingPrice || 0;
        const profit = sell - cost;
        const profitPct = cost > 0 ? ((profit / cost) * 100).toFixed(1) + '%' : '0%';
        const stock = p.stock || 0;
        const assetValue = cost * stock;

        return [
          this.escapeCsv(p.id),
          this.escapeCsv(p.barcode || '-'),
          this.escapeCsv(p.name),
          this.escapeCsv(p.category || 'Umum'),
          this.escapeCsv(cost),
          this.escapeCsv(sell),
          this.escapeCsv(profit),
          this.escapeCsv(profitPct),
          this.escapeCsv(stock),
          this.escapeCsv(p.unit || 'Pcs'),
          this.escapeCsv(assetValue),
          this.escapeCsv(p.updatedAt || p.createdAt || '-')
        ].join(',');
      });

      // UTF-8 BOM (\uFEFF) agar terbaca sempurna di Microsoft Excel
      const csvContent = '\uFEFF' + [headers.map(h => this.escapeCsv(h)).join(','), ...rows].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="katalog-produk-${dateStr}.csv"`);
      return res.status(200).send(csvContent);
    } catch (error) {
      console.error('[ProductController] Error exportProductsCsv:', error);
      return res.status(500).send('Gagal mengekspor data produk: ' + error.message);
    }
  }
}

module.exports = new ProductController();
