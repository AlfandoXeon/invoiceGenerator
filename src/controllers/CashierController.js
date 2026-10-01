const BaseController = require('./BaseController');
const StoreConfig = require('../models/StoreConfig');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

/**
 * CashierController - Mengelola tampilan Kasir, kalkulasi kasir & checkout
 */
class CashierController extends BaseController {
  constructor() {
    super();
    this.renderCashierPage = this.renderCashierPage.bind(this);
    this.processCheckout = this.processCheckout.bind(this);
    this.getNextInvoiceNumber = this.getNextInvoiceNumber.bind(this);
  }

  /**
   * Menampilkan halaman utama Kasir / POS
   */
  async renderCashierPage(req, res) {
    try {
      const config = await StoreConfig.get();
      const products = await Product.getAll();
      const nextInvoice = await Transaction.generateInvoiceNumber();
      const stats = await Transaction.getStats();

      res.render('pages/cashier', {
        title: 'Menu Kasir POS - Xeon Invoice Generator',
        page: 'cashier',
        config,
        products,
        nextInvoice,
        stats,
        formatRupiah: this.formatRupiah
      });
    } catch (error) {
      console.error('[CashierController] Error renderCashierPage:', error);
      res.status(500).send('Gagal memuat halaman kasir: ' + error.message);
    }
  }

  /**
   * Endpoint API pemrosesan transaksi dan simpan ke data/transactions.json
   */
  async processCheckout(req, res) {
    try {
      const {
        invoiceNumber,
        cashier,
        items,
        subtotal,
        discount,
        taxPercent,
        taxAmount,
        grandTotal,
        paymentMethod,
        cashReceived,
        change,
        note
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return this.sendError(res, 'Item belanjaan tidak boleh kosong', 400);
      }

      const transaction = await Transaction.create({
        invoiceNumber,
        cashier,
        items,
        subtotal,
        discount,
        taxPercent,
        taxAmount,
        grandTotal,
        paymentMethod,
        cashReceived,
        change,
        note
      });

      return this.sendSuccess(res, transaction, 'Transaksi berhasil dicatat dan disimpan ke riwayat!');
    } catch (error) {
      console.error('[CashierController] Error processCheckout:', error);
      return this.sendError(res, 'Gagal memproses transaksi: ' + error.message);
    }
  }

  /**
   * Endpoint API mendapatkan nomor invoice baru berikutnya
   */
  async getNextInvoiceNumber(req, res) {
    try {
      const invoiceNumber = await Transaction.generateInvoiceNumber();
      return this.sendSuccess(res, { invoiceNumber });
    } catch (error) {
      return this.sendError(res, error.message);
    }
  }
}

module.exports = new CashierController();
