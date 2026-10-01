const BaseController = require('./BaseController');
const StoreConfig = require('../models/StoreConfig');

/**
 * ConfigController - Mengelola pengaturan identitas toko & preferensi struk bagi Owner UMKM
 */
class ConfigController extends BaseController {
  constructor() {
    super();
    this.renderConfigPage = this.renderConfigPage.bind(this);
    this.updateConfig = this.updateConfig.bind(this);
    this.uploadLogo = this.uploadLogo.bind(this);
  }

  /**
   * Menampilkan halaman konfigurasi toko
   */
  async renderConfigPage(req, res) {
    try {
      const config = await StoreConfig.get();
      res.render('pages/config', {
        title: 'Konfigurasi Toko & Owner - Xeon Invoice Generator',
        page: 'config',
        config,
        successMessage: req.query.saved === 'true' ? 'Konfigurasi toko berhasil disimpan!' : null
      });
    } catch (error) {
      console.error('[ConfigController] Error renderConfigPage:', error);
      res.status(500).send('Gagal memuat konfigurasi: ' + error.message);
    }
  }

  /**
   * Memperbarui konfigurasi toko dari form POST
   */
  async updateConfig(req, res) {
    try {
      const {
        storeName,
        tagline,
        address,
        phone,
        email,
        useLogoOnReceipt,
        defaultCashier,
        invoicePrefix,
        defaultTaxPercent,
        paperSize,
        defaultPaymentMethod,
        footerNote
      } = req.body;

      const payload = {
        store: {
          name: storeName || 'Nama Toko',
          tagline: tagline || '',
          address: address || '',
          phone: phone || '',
          email: email || '',
          useLogoOnReceipt: useLogoOnReceipt === 'true' || useLogoOnReceipt === true || useLogoOnReceipt === 'on'
        },
        pos: {
          defaultCashier: defaultCashier || 'Kasir',
          invoicePrefix: invoicePrefix || 'XEON-',
          defaultTaxPercent: parseFloat(defaultTaxPercent) || 0,
          paperSize: paperSize === '80mm' ? '80mm' : '58mm',
          defaultPaymentMethod: defaultPaymentMethod || 'TUNAI',
          footerNote: footerNote || ''
        }
      };

      await StoreConfig.update(payload);

      // Jika request AJAX
      if (req.xhr || req.headers.accept?.includes('json')) {
        return this.sendSuccess(res, payload, 'Konfigurasi berhasil disimpan');
      }

      // Redirect kembali ke form dengan feedback
      res.redirect('/config?saved=true');
    } catch (error) {
      console.error('[ConfigController] Error updateConfig:', error);
      if (req.xhr || req.headers.accept?.includes('json')) {
        return this.sendError(res, 'Gagal menyimpan: ' + error.message);
      }
      res.status(500).send('Gagal menyimpan konfigurasi');
    }
  }

  /**
   * Upload logo toko baru
   */
  async uploadLogo(req, res) {
    try {
      if (!req.file) {
        return this.sendError(res, 'Tidak ada file gambar yang diupload', 400);
      }

      const logoUrl = `/uploads/${req.file.filename}`;
      await StoreConfig.updateLogo(logoUrl);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return this.sendSuccess(res, { logoUrl }, 'Logo toko berhasil diperbarui');
      }

      res.redirect('/config?saved=true');
    } catch (error) {
      console.error('[ConfigController] Error uploadLogo:', error);
      return this.sendError(res, 'Gagal upload logo: ' + error.message);
    }
  }
}

module.exports = new ConfigController();
