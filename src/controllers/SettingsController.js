const BaseController = require('./BaseController');
const StoreConfig = require('../models/StoreConfig');
const Database = require('../models/Database');
const path = require('path');
const fs = require('fs');
const os = require('os');
const archiver = require('archiver');
const AdmZip = require('adm-zip');

/**
 * SettingsController - Mengelola pengaturan kasir, tema, sistem & backup data
 */
class SettingsController extends BaseController {
  constructor() {
    super();
    this.renderSettingsPage = this.renderSettingsPage.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.backupDatabase = this.backupDatabase.bind(this);
    this.restoreDatabase = this.restoreDatabase.bind(this);
  }

  formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d} hari`);
    if (h > 0) parts.push(`${h} jam`);
    if (m > 0) parts.push(`${m} menit`);
    parts.push(`${s} detik`);
    return parts.join(' ');
  }

  async renderSettingsPage(req, res) {
    try {
      const config = await StoreConfig.get();
      
      // Informasi lingkungan runtime
      const systemInfo = {
        nodeVersion: process.version,
        platform: os.type() + ' (' + os.release() + ')',
        arch: os.arch(),
        uptime: this.formatUptime(process.uptime()),
        memoryRss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        port: process.env.PORT || 3000,
        hostname: os.hostname()
      };

      let successMsg = null;
      if (req.query.saved === 'true') {
        successMsg = 'Pengaturan berhasil disimpan!';
      } else if (req.query.restored === 'true') {
        successMsg = 'Data toko dan basis data berhasil dipulihkan dari cadangan ZIP!';
      }

      res.render('pages/settings', {
        title: 'Pengaturan & Sistem - Xeon Invoice Generator',
        page: 'settings',
        config,
        systemInfo,
        successMessage: successMsg
      });
    } catch (error) {
      console.error('[SettingsController] Error renderSettingsPage:', error);
      res.status(500).send('Gagal memuat pengaturan: ' + error.message);
    }
  }

  async updateSettings(req, res) {
    try {
      const {
        defaultCashier,
        cashiersList,
        theme,
        requireConfirmation,
        showBarcodeOnReceipt
      } = req.body;

      // Parsing daftar kasir dari textarea atau input
      let cashiers = [];
      if (typeof cashiersList === 'string') {
        cashiers = cashiersList
          .split('\n')
          .map(c => c.trim())
          .filter(Boolean);
      } else if (Array.isArray(cashiersList)) {
        cashiers = cashiersList.map(c => c.trim()).filter(Boolean);
      }

      if (cashiers.length === 0) {
        cashiers = [defaultCashier || 'Kasir'];
      }

      const updatePayload = {
        pos: {
          defaultCashier: defaultCashier || cashiers[0] || 'Kasir',
          cashiers: cashiers,
          theme: theme || 'light',
          requireConfirmation: requireConfirmation === 'on' || requireConfirmation === 'true' || requireConfirmation === true,
          showBarcodeOnReceipt: showBarcodeOnReceipt === 'on' || showBarcodeOnReceipt === 'true' || showBarcodeOnReceipt === true
        }
      };

      await StoreConfig.update(updatePayload);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return this.sendSuccess(res, updatePayload, 'Pengaturan berhasil disimpan');
      }

      res.redirect('/settings?saved=true');
    } catch (error) {
      console.error('[SettingsController] Error updateSettings:', error);
      res.status(500).send('Gagal menyimpan pengaturan: ' + error.message);
    }
  }

  async backupDatabase(req, res) {
    try {
      // Pastikan seluruh transaksi pada WAL file tersinkronisasi ke berkas database.sqlite
      try {
        await Database.run('PRAGMA wal_checkpoint(TRUNCATE);');
      } catch (walErr) {
        console.warn('[SettingsController] Peringatan wal_checkpoint:', walErr.message);
      }

      const configPath = path.join(__dirname, '../../data/config.json');
      const dbPath = path.join(__dirname, '../../data/database.sqlite');

      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `cadangan-data-toko-${dateStr}.zip`;

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const createZipArchive = (options) => {
        if (typeof archiver === 'function') return archiver('zip', options);
        if (archiver.ZipArchive) return new archiver.ZipArchive(options);
        if (archiver.Archiver) return new archiver.Archiver('zip', options);
        throw new Error('Konstruktor ZIP tidak ditemukan');
      };

      const archive = createZipArchive({
        zlib: { level: 9 }
      });

      archive.on('error', (err) => {
        console.error('[SettingsController] Error archiver:', err);
        if (!res.headersSent) {
          res.status(500).send('Gagal membuat berkas ZIP: ' + err.message);
        }
      });

      archive.pipe(res);

      // 1. Masukkan berkas config.json
      if (fs.existsSync(configPath)) {
        if (typeof archive.file === 'function') {
          archive.file(configPath, { name: 'config.json' });
        } else {
          archive.append(fs.createReadStream(configPath), { name: 'config.json' });
        }
      }

      // 2. Masukkan berkas database.sqlite
      if (fs.existsSync(dbPath)) {
        if (typeof archive.file === 'function') {
          archive.file(dbPath, { name: 'database.sqlite' });
        } else {
          archive.append(fs.createReadStream(dbPath), { name: 'database.sqlite' });
        }
      }

      await archive.finalize();
    } catch (error) {
      console.error('[SettingsController] Error backupDatabase:', error);
      if (!res.headersSent) {
        res.status(500).send('Gagal membuat cadangan: ' + error.message);
      }
    }
  }

  /**
   * Memulihkan data toko dan basis data SQLite dari berkas ZIP cadangan
   */
  async restoreDatabase(req, res) {
    try {
      if (!req.file || !req.file.buffer) {
        return this.sendError(res, 'Berkas ZIP tidak ditemukan. Silakan pilih berkas cadangan (.ZIP)', 400);
      }

      let zip;
      try {
        zip = new AdmZip(req.file.buffer);
      } catch (parseErr) {
        return this.sendError(res, 'Berkas yang diunggah bukan arsip ZIP yang valid', 400);
      }

      const zipEntries = zip.getEntries();
      let configEntry = null;
      let sqliteEntry = null;

      for (const entry of zipEntries) {
        if (entry.isDirectory) continue;
        const name = entry.entryName.toLowerCase();
        if (name === 'config.json' || name.endsWith('/config.json') || name.endsWith('\\config.json')) {
          configEntry = entry;
        }
        if (name === 'database.sqlite' || name.endsWith('/database.sqlite') || name.endsWith('\\database.sqlite')) {
          sqliteEntry = entry;
        }
      }

      if (!configEntry && !sqliteEntry) {
        return this.sendError(
          res,
          'Berkas cadangan tidak valid. Berkas ZIP harus berisi database.sqlite atau config.json.',
          400
        );
      }

      const dataDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const restoredItems = [];

      // 1. Pulihkan config.json jika ada di dalam berkas ZIP
      if (configEntry) {
        try {
          const configJsonStr = configEntry.getData().toString('utf8');
          const parsed = JSON.parse(configJsonStr);
          const configDest = path.join(dataDir, 'config.json');
          fs.writeFileSync(configDest, JSON.stringify(parsed, null, 2), 'utf8');
          restoredItems.push('Pengaturan Toko (config.json)');
        } catch (configErr) {
          return this.sendError(res, 'Format config.json di dalam berkas ZIP tidak valid: ' + configErr.message, 400);
        }
      }

      // 2. Pulihkan database.sqlite jika ada di dalam berkas ZIP
      if (sqliteEntry) {
        // Tutup koneksi aktif SQLite
        await Database.close();

        // Hapus berkas wal dan shm lama agar tidak menimpa data yang baru dipulihkan
        const walPath = path.join(dataDir, 'database.sqlite-wal');
        const shmPath = path.join(dataDir, 'database.sqlite-shm');
        if (fs.existsSync(walPath)) {
          try { fs.unlinkSync(walPath); } catch (_) {}
        }
        if (fs.existsSync(shmPath)) {
          try { fs.unlinkSync(shmPath); } catch (_) {}
        }

        const dbDest = path.join(dataDir, 'database.sqlite');
        fs.writeFileSync(dbDest, sqliteEntry.getData());

        // Buka kembali koneksi SQLite dan verifikasi
        await Database.init();
        restoredItems.push('Basis Data Produk & Transaksi (database.sqlite)');
      }

      const successMsg = `Berhasil memulihkan cadangan: ${restoredItems.join(' dan ')}.`;

      if (req.xhr || req.headers.accept?.includes('json')) {
        return this.sendSuccess(res, { restoredItems }, successMsg);
      }

      res.redirect('/settings?restored=true');
    } catch (error) {
      console.error('[SettingsController] Error restoreDatabase:', error);
      try {
        await Database.init();
      } catch (_) {}
      return this.sendError(res, 'Gagal memulihkan cadangan: ' + error.message, 500);
    }
  }
}

module.exports = new SettingsController();
