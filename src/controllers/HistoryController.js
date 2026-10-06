const BaseController = require('./BaseController');
const Transaction = require('../models/Transaction');
const StoreConfig = require('../models/StoreConfig');
const Product = require('../models/Product');
const Database = require('../models/Database');

/**
 * HistoryController - Mengelola riwayat transaksi penjualan & pencetakan ulang
 */
class HistoryController extends BaseController {
  constructor() {
    super();
    this.renderHistoryPage = this.renderHistoryPage.bind(this);
    this.getTransactionDetail = this.getTransactionDetail.bind(this);
    this.deleteTransaction = this.deleteTransaction.bind(this);
    this.renderPrintThermal = this.renderPrintThermal.bind(this);
  }

  /**
   * Menampilkan halaman riwayat transaksi
   */
  async renderHistoryPage(req, res) {
    try {
      const config = await StoreConfig.get();
      const transactions = await Transaction.getAll();
      const stats = await Transaction.getStats();

      res.render('pages/history', {
        title: 'Riwayat Transaksi Penjualan - Xeon Invoice Generator',
        page: 'history',
        config,
        transactions,
        stats,
        formatRupiah: this.formatRupiah
      });
    } catch (error) {
      console.error('[HistoryController] Error renderHistoryPage:', error);
      res.status(500).send('Gagal memuat riwayat: ' + error.message);
    }
  }

  /**
   * API: Mengambil rincian 1 transaksi
   */
  async getTransactionDetail(req, res) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.getById(id);
      if (!transaction) {
        return this.sendError(res, 'Transaksi tidak ditemukan', 404);
      }

      return this.sendSuccess(res, transaction);
    } catch (error) {
      return this.sendError(res, error.message);
    }
  }

  /**
   * API: Menghapus catatan transaksi dan mengembalikan stok
   */
  async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.getById(id);
      if (!transaction) {
        return this.sendError(res, 'Transaksi tidak ditemukan', 404);
      }

      // Eksekusi atomik: kembalikan stok produk lalu hapus transaksi
      await Database.withTransaction(async () => {
        if (Array.isArray(transaction.items) && transaction.items.length > 0) {
          await Product.restoreStock(transaction.items);
        }
        const success = await Transaction.delete(id);
        if (!success) {
          throw new Error('Gagal menghapus catatan transaksi dari database');
        }
      });

      return this.sendSuccess(res, null, 'Catatan transaksi berhasil dihapus dan stok barang telah dikembalikan');
    } catch (error) {
      return this.sendError(res, error.message);
    }
  }

  /**
   * Tampilan khusus cetak thermal via browser
   */
  async renderPrintThermal(req, res) {
    try {
      const { id } = req.params;
      const transaction = await Transaction.getById(id);
      const config = await StoreConfig.get();

      if (!transaction) {
        return res.status(404).send('Transaksi tidak ditemukan');
      }

      res.render('layouts/print', {
        layout: false,
        config,
        transaction,
        formatRupiah: this.formatRupiah
      });
    } catch (error) {
      res.status(500).send('Gagal memuat cetakan thermal: ' + error.message);
    }
  }
}

module.exports = new HistoryController();
