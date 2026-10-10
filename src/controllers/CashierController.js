const BaseController = require('./BaseController');
const StoreConfig = require('../models/StoreConfig');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Database = require('../models/Database');

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

      const numCash = parseFloat(cashReceived) || 0;
      const numGrandTotal = parseFloat(grandTotal) || 0;

      if (numCash < 0) {
        return this.sendError(res, 'Uang pembayaran tidak boleh bernilai minus (negatif)', 400);
      }

      if (numGrandTotal > 0 && numCash < numGrandTotal) {
        return this.sendError(res, `Uang diterima (Rp ${numCash.toLocaleString('id-ID')}) kurang dari total belanja (Rp ${numGrandTotal.toLocaleString('id-ID')}). Pembayaran belum lunas.`, 400);
      }

      // 1. Validasi ketersediaan stok barang sebelum transaksi dicatat
      const stockValidation = await Product.validateStock(items);
      if (!stockValidation.valid) {
        return this.sendError(res, stockValidation.errors.join('; '), 400);
      }

      // Ambil seluruh data produk untuk snapshot costPrice (HPP) yang akurat
      const allProducts = await Product.getAll();
      let calculatedTotalCost = 0;

      const enrichedItems = items.map(item => {
        let costPrice = parseFloat(item.costPrice) || 0;
        if (!costPrice) {
          const prod = allProducts.find(p => 
            (item.id && String(p.id) === String(item.id)) ||
            (item.productId && String(p.id) === String(item.productId)) ||
            (item.barcode && p.barcode && p.barcode.trim() === String(item.barcode).trim()) ||
            (item.name && p.name && p.name.trim().toLowerCase() === String(item.name).trim().toLowerCase())
          );
          if (prod) {
            costPrice = parseFloat(prod.costPrice) || 0;
          }
        }
        const qty = parseInt(item.qty, 10) || 1;
        calculatedTotalCost += (costPrice * qty);
        return {
          ...item,
          costPrice
        };
      });

      // 2 & 3. Eksekusi atomik: kurangi stok dan catat transaksi
      const { transaction, updatedProducts } = await Database.withTransaction(async () => {
        const reduced = await Product.deductStock(enrichedItems);
        const trx = await Transaction.create({
          invoiceNumber,
          cashier,
          items: enrichedItems,
          subtotal,
          discount,
          taxPercent,
          taxAmount,
          grandTotal,
          totalCost: calculatedTotalCost,
          paymentMethod,
          cashReceived,
          change,
          note
        });
        return { transaction: trx, updatedProducts: reduced };
      });

      // 4. Ambil seluruh data produk terbaru untuk sinkronisasi antarmuka kasir
      const currentProducts = await Product.getAll();

      return this.sendSuccess(res, {
        transaction,
        updatedProducts,
        products: currentProducts
      }, 'Transaksi berhasil dicatat dan stok barang telah diperbarui!');
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
