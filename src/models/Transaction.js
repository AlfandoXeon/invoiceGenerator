const path = require('path');
const JsonStorage = require('./JsonStorage');
const StoreConfig = require('./StoreConfig');

/**
 * Transaction Model - OOP Entity untuk pencatatan riwayat transaksi & invoice UMKM
 */
class Transaction {
  static get filePath() {
    return path.join(__dirname, '../../data/transactions.json');
  }

  /**
   * Mengambil semua riwayat transaksi
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const list = await JsonStorage.read(this.filePath, []);
    return Array.isArray(list) ? list : [];
  }

  /**
   * Mengambil transaksi berdasarkan ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    const list = await this.getAll();
    return list.find(item => String(item.id) === String(id)) || null;
  }

  /**
   * Menghasilkan nomor nota faktur otomatis yang unik (contoh: AXS-20261002-0001)
   * @returns {Promise<string>}
   */
  static async generateInvoiceNumber() {
    const config = await StoreConfig.get();
    const prefix = config.pos.invoicePrefix || 'XEON-';

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const list = await this.getAll();
    // Hitung berapa transaksi hari ini
    const todayCount = list.filter(item => {
      if (!item.invoiceNumber) return false;
      return item.invoiceNumber.includes(dateStr);
    }).length;

    const sequence = String(todayCount + 1).padStart(4, '0');
    return `${prefix}${dateStr}-${sequence}`;
  }

  /**
   * Menyimpan transaksi penjualan baru
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const list = await this.getAll();
    const config = await StoreConfig.get();

    const now = new Date();
    const invoiceNumber = data.invoiceNumber || await this.generateInvoiceNumber();

    const newTransaction = {
      id: `trx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      invoiceNumber: invoiceNumber,
      timestamp: now.toISOString(),
      formattedDate: now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) + ' ' + now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace('.', ':'),
      cashier: (data.cashier || config.pos.defaultCashier || 'Kasir').trim(),
      items: Array.isArray(data.items) ? data.items : [],
      subtotal: parseFloat(data.subtotal) || 0,
      discount: parseFloat(data.discount) || 0,
      taxPercent: parseFloat(data.taxPercent) || 0,
      taxAmount: parseFloat(data.taxAmount) || 0,
      grandTotal: parseFloat(data.grandTotal) || 0,
      paymentMethod: (data.paymentMethod || config.pos.defaultPaymentMethod || 'TUNAI').toUpperCase(),
      cashReceived: parseFloat(data.cashReceived) || 0,
      change: parseFloat(data.change) || 0,
      note: (data.note || '').trim()
    };

    list.unshift(newTransaction);
    await JsonStorage.write(this.filePath, list);
    return newTransaction;
  }

  /**
   * Menghapus transaksi berdasarkan ID
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const list = await this.getAll();
    const filtered = list.filter(item => String(item.id) !== String(id));
    if (filtered.length === list.length) return false;

    await JsonStorage.write(this.filePath, filtered);
    return true;
  }

  /**
   * Menghitung statistik penjualan sederhana (Hari ini & Total)
   * @returns {Promise<Object>}
   */
  static async getStats() {
    const list = await this.getAll();
    const now = new Date();
    const todayDate = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    let todaySales = 0;
    let todayCount = 0;
    let totalSales = 0;

    for (const trx of list) {
      totalSales += (trx.grandTotal || 0);
      if (trx.formattedDate && trx.formattedDate.startsWith(todayDate)) {
        todaySales += (trx.grandTotal || 0);
        todayCount++;
      }
    }

    return {
      todaySales,
      todayCount,
      totalSales,
      totalCount: list.length
    };
  }
}

module.exports = Transaction;
