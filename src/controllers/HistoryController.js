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
    this.exportTransactionsCsv = this.exportTransactionsCsv.bind(this);
  }

  /**
   * Menampilkan halaman riwayat transaksi
   */
  async renderHistoryPage(req, res) {
    try {
      const config = await StoreConfig.get();
      const { startDate, endDate } = req.query;

      let transactions;
      if (startDate || endDate) {
        transactions = await Transaction.getByDateRange(startDate, endDate);
      } else {
        transactions = await Transaction.getAll();
      }

      const stats = await Transaction.getStats();

      res.render('pages/history', {
        title: 'Riwayat Transaksi Penjualan - Xeon Invoice Generator',
        page: 'history',
        config,
        transactions,
        stats,
        filterDates: {
          startDate: startDate || '',
          endDate: endDate || ''
        },
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

  /**
   * Helper format escape cell CSV
   */
  escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Ekspor rekap riwayat transaksi ke format CSV (Excel Friendly)
   */
  async exportTransactionsCsv(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const transactions = await Transaction.getByDateRange(startDate, endDate);

      const headers = [
        'Nomor Nota',
        'Waktu Transaksi',
        'Petugas Kasir',
        'Metode Bayar',
        'Subtotal (Rp)',
        'Diskon (Rp)',
        'Pajak PPN (Rp)',
        'Total Belanja (Rp)',
        'Total Modal HPP (Rp)',
        'Estimasi Laba Bersih (Rp)',
        'Uang Diterima (Rp)',
        'Kembalian (Rp)',
        'Jumlah Variasi Barang',
        'Rincian Barang Belanjaan',
        'Catatan'
      ];

      const rows = transactions.map(t => {
        const subtotal = t.subtotal || 0;
        const discount = t.discount || 0;
        const taxAmount = t.taxAmount || 0;
        const grandTotal = t.grandTotal || 0;
        const totalCost = t.totalCost || 0;
        const profit = grandTotal - totalCost;
        const cashReceived = t.cashReceived || 0;
        const change = t.change || 0;
        const items = Array.isArray(t.items) ? t.items : [];

        const itemsSummary = items
          .map(i => `${i.name} (${i.qty} x ${i.price})`)
          .join('; ');

        return [
          this.escapeCsv(t.invoiceNumber),
          this.escapeCsv(t.formattedDate),
          this.escapeCsv(t.cashier),
          this.escapeCsv(t.paymentMethod),
          this.escapeCsv(subtotal),
          this.escapeCsv(discount),
          this.escapeCsv(taxAmount),
          this.escapeCsv(grandTotal),
          this.escapeCsv(totalCost),
          this.escapeCsv(profit),
          this.escapeCsv(cashReceived),
          this.escapeCsv(change),
          this.escapeCsv(items.length),
          this.escapeCsv(itemsSummary),
          this.escapeCsv(t.note || '')
        ].join(',');
      });

      // UTF-8 BOM (\uFEFF) untuk kompatibilitas langsung di Microsoft Excel
      const csvContent = '\uFEFF' + [headers.map(h => this.escapeCsv(h)).join(','), ...rows].join('\r\n');

      const dateSuffix = (startDate && endDate)
        ? `${startDate}_sd_${endDate}`
        : (startDate ? `dari_${startDate}` : new Date().toISOString().slice(0, 10));

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="rekap-penjualan-${dateSuffix}.csv"`);
      return res.status(200).send(csvContent);
    } catch (error) {
      console.error('[HistoryController] Error exportTransactionsCsv:', error);
      return res.status(500).send('Gagal mengekspor riwayat transaksi: ' + error.message);
    }
  }
}

module.exports = new HistoryController();
