const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * Database Module - Pengelola koneksi dan skema SQLite 3 lokal UMKM
 */
class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/database.sqlite');
    this.db = null;
    this.initPromise = null;
    this.init();
  }

  /**
   * Inisialisasi koneksi SQLite dan pembuatan tabel otomatis
   */
  init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Pastikan folder data tersedia
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, async (err) => {
        if (err) {
          console.error('[Database] Gagal membuka koneksi SQLite 3:', err.message);
          return reject(err);
        }

        try {
          // Konfigurasi performa tinggi SQLite (WAL Mode)
          await this.run('PRAGMA journal_mode = WAL;');
          await this.run('PRAGMA synchronous = NORMAL;');
          await this.run('PRAGMA foreign_keys = ON;');

          // Buat tabel products
          await this.run(`
            CREATE TABLE IF NOT EXISTS products (
              id TEXT PRIMARY KEY,
              barcode TEXT DEFAULT '',
              name TEXT NOT NULL,
              category TEXT DEFAULT 'Umum',
              costPrice REAL DEFAULT 0,
              sellingPrice REAL DEFAULT 0,
              unit TEXT DEFAULT 'Pcs',
              stock INTEGER DEFAULT 0,
              createdAt TEXT,
              updatedAt TEXT
            );
          `);

          await this.run(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`);
          await this.run(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);`);

          // Buat tabel transactions
          await this.run(`
            CREATE TABLE IF NOT EXISTS transactions (
              id TEXT PRIMARY KEY,
              invoiceNumber TEXT NOT NULL UNIQUE,
              timestamp TEXT NOT NULL,
              formattedDate TEXT NOT NULL,
              cashier TEXT NOT NULL,
              items TEXT NOT NULL,
              subtotal REAL DEFAULT 0,
              discount REAL DEFAULT 0,
              taxPercent REAL DEFAULT 0,
              taxAmount REAL DEFAULT 0,
              grandTotal REAL DEFAULT 0,
              paymentMethod TEXT DEFAULT 'TUNAI',
              cashReceived REAL DEFAULT 0,
              change REAL DEFAULT 0,
              note TEXT DEFAULT ''
            );
          `);

          await this.run(`CREATE INDEX IF NOT EXISTS idx_trx_invoiceNumber ON transactions(invoiceNumber);`);
          await this.run(`CREATE INDEX IF NOT EXISTS idx_trx_timestamp ON transactions(timestamp);`);
          await this.run(`CREATE INDEX IF NOT EXISTS idx_trx_formattedDate ON transactions(formattedDate);`);

          resolve(this.db);
        } catch (tableErr) {
          console.error('[Database] Gagal menyiapkan skema tabel:', tableErr.message);
          reject(tableErr);
        }
      });
    });

    return this.initPromise;
  }

  /**
   * Helper Promise untuk eksekusi query run (INSERT, UPDATE, DELETE)
   */
  async run(sql, params = []) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  /**
   * Helper Promise untuk query single row (SELECT satu data)
   */
  async get(sql, params = []) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  /**
   * Helper Promise untuk query multiple rows (SELECT banyak data)
   */
  async all(sql, params = []) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }

  /**
   * Membuka transaksi database SQLite
   */
  async beginTransaction() {
    return await this.run('BEGIN TRANSACTION;');
  }

  /**
   * Commit transaksi database SQLite
   */
  async commit() {
    return await this.run('COMMIT;');
  }

  /**
   * Rollback transaksi database SQLite
   */
  async rollback() {
    return await this.run('ROLLBACK;');
  }

  /**
   * Eksekusi blok fungsi dalam satu transaksi database atomik
   * @param {Function} callback - async (db) => {}
   */
  async withTransaction(callback) {
    await this.beginTransaction();
    try {
      const result = await callback(this);
      await this.commit();
      return result;
    } catch (error) {
      try {
        await this.rollback();
      } catch (rollbackErr) {
        console.error('[Database] Rollback error:', rollbackErr.message);
      }
      throw error;
    }
  }

  /**
   * Menutup koneksi database SQLite yang sedang aktif
   */
  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            console.error('[Database] Gagal menutup koneksi:', err.message);
            return reject(err);
          }
          this.db = null;
          this.initPromise = null;
          resolve();
        });
      });
    }
  }

  /**
   * Membuka ulang koneksi database SQLite setelah data dipulihkan
   */
  async reopen() {
    await this.close();
    return await this.init();
  }
}

module.exports = new Database();
