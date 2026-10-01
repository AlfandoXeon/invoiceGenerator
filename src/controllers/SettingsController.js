const BaseController = require('./BaseController');
const StoreConfig = require('../models/StoreConfig');
const JsonStorage = require('../models/JsonStorage');
const path = require('path');
const os = require('os');

/**
 * SettingsController - Mengelola pengaturan kasir, tema, sistem & backup data
 */
class SettingsController extends BaseController {
  constructor() {
    super();
    this.renderSettingsPage = this.renderSettingsPage.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.backupDatabase = this.backupDatabase.bind(this);
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

      res.render('pages/settings', {
        title: 'Pengaturan & Sistem - Xeon Invoice Generator',
        page: 'settings',
        config,
        systemInfo,
        successMessage: req.query.saved === 'true' ? 'Pengaturan berhasil disimpan!' : null
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
      const config = await StoreConfig.get();
      const products = await JsonStorage.read(path.join(__dirname, '../../data/products.json'), []);
      const transactions = await JsonStorage.read(path.join(__dirname, '../../data/transactions.json'), []);

      const backupData = {
        exportedAt: new Date().toISOString(),
        appName: "Xeon Invoice Generator",
        version: "1.0.0",
        config,
        products,
        transactions
      };

      const filename = `cadangan-data-toko-${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader('Content-disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-type', 'application/json');
      res.write(JSON.stringify(backupData, null, 2));
      res.end();
    } catch (error) {
      res.status(500).send('Gagal membuat cadangan: ' + error.message);
    }
  }
}

module.exports = new SettingsController();
