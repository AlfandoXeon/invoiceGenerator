const Database = require('./Database');
const StoreConfig = require('./StoreConfig');

/**
 * Transaction Model - OOP Entity untuk pencatatan riwayat transaksi dengan database SQLite 3
 */
class Transaction {
  /**
   * Mengambil semua riwayat transaksi dari SQLite 3
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const rows = await Database.all('SELECT * FROM transactions ORDER BY timestamp DESC;');
    return rows.map(r => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])
    }));
  }

  /**
   * Mengambil satu transaksi berdasarkan ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    if (!id) return null;
    const r = await Database.get('SELECT * FROM transactions WHERE id = ?;', [String(id)]);
    if (!r) return null;

    return {
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items || '[]') : (r.items || [])
    };
  }

  /**
   * Menghasilkan nomor nota faktur otomatis yang unik (contoh: XEON-20261002-0001)
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

    // Hitung berapa transaksi yang tercatat hari ini menggunakan query SQL cepat
    const row = await Database.get(
      'SELECT COUNT(*) as count FROM transactions WHERE invoiceNumber LIKE ?;',
      [`%${dateStr}%`]
    );
    const todayCount = row ? row.count : 0;
    const sequence = String(todayCount + 1).padStart(4, '0');
    return `${prefix}${dateStr}-${sequence}`;
  }

  /**
   * Menyimpan transaksi penjualan baru ke SQLite 3
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const config = await StoreConfig.get();
    const now = new Date();
    const invoiceNumber = data.invoiceNumber || await this.generateInvoiceNumber();

    const items = Array.isArray(data.items) ? data.items : [];
    const itemsJson = JSON.stringify(items);

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
      items: items,
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

    await Database.run(`
      INSERT INTO transactions (
        id, invoiceNumber, timestamp, formattedDate, cashier, items,
        subtotal, discount, taxPercent, taxAmount, grandTotal,
        paymentMethod, cashReceived, change, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newTransaction.id,
      newTransaction.invoiceNumber,
      newTransaction.timestamp,
      newTransaction.formattedDate,
      newTransaction.cashier,
      itemsJson,
      newTransaction.subtotal,
      newTransaction.discount,
      newTransaction.taxPercent,
      newTransaction.taxAmount,
      newTransaction.grandTotal,
      newTransaction.paymentMethod,
      newTransaction.cashReceived,
      newTransaction.change,
      newTransaction.note
    ]);

    return newTransaction;
  }

  /**
   * Menghapus transaksi berdasarkan ID
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await Database.run('DELETE FROM transactions WHERE id = ?;', [String(id)]);
    return result.changes > 0;
  }

  /**
   * Menghitung statistik penjualan secara instan dengan agregasi SQL
   * @returns {Promise<Object>}
   */
  static async getStats() {
    const now = new Date();
    const todayDate = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const todayStats = await Database.get(
      'SELECT COALESCE(SUM(grandTotal), 0) as todaySales, COUNT(*) as todayCount FROM transactions WHERE formattedDate LIKE ?;',
      [`${todayDate}%`]
    );

    const totalStats = await Database.get(
      'SELECT COALESCE(SUM(grandTotal), 0) as totalSales, COUNT(*) as totalCount FROM transactions;'
    );

    return {
      todaySales: todayStats ? todayStats.todaySales : 0,
      todayCount: todayStats ? todayStats.todayCount : 0,
      totalSales: totalStats ? totalStats.totalSales : 0,
      totalCount: totalStats ? totalStats.totalCount : 0
    };
  }
}

module.exports = Transaction;
