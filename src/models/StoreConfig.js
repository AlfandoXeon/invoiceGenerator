const path = require('path');
const JsonStorage = require('./JsonStorage');

/**
 * StoreConfig Model - OOP Entity untuk konfigurasi toko & POS
 */
class StoreConfig {
  static get filePath() {
    return path.join(__dirname, '../../data/config.json');
  }

  static get defaultData() {
    return {
      store: {
        name: "Xeon Store",
        tagline: "Belanja Puas, Harga Pas!",
        address: "Jalan Raya Metro-Wates, Bumi Agung, Bumi Ratu Nuban, Lampung Tengah, Lampung, Indonesia",
        phone: "085764175824",
        email: "xeonstr@gmail.com",
        logoUrl: "",
        useLogoOnReceipt: true
      },
      pos: {
        defaultCashier: "Xeon",
        cashiers: ["Xeon", "Kasir 1", "Owner"],
        theme: "light",
        invoicePrefix: "AX-",
        defaultTaxPercent: 10,
        paperSize: "58mm",
        defaultPaymentMethod: "TUNAI",
        requireConfirmation: true,
        showBarcodeOnReceipt: true,
        footerNote: "TERIMA KASIH ATAS KUNJUNGAN ANDA\nLAYANAN KONSUMEN SMS/WA: 0811-1500-959\nBARANG YANG SUDAH DIBELI TIDAK DAPAT DITUKAR\nSIMPAN STRUK INI SEBAGAI BUKTI PEMBAYARAN"
      }
    };
  }

  /**
   * Mengambil konfigurasi lengkap toko & pos
   * @returns {Promise<Object>}
   */
  static async get() {
    const data = await JsonStorage.read(this.filePath, this.defaultData);
    if (!data) return this.defaultData;
    if (!data.pos) data.pos = { ...this.defaultData.pos };
    if (!Array.isArray(data.pos.cashiers)) data.pos.cashiers = ["HOKI", "Kasir 1"];
    if (!data.pos.theme) data.pos.theme = "light";
    if (data.pos.requireConfirmation === undefined) data.pos.requireConfirmation = true;
    if (data.pos.showBarcodeOnReceipt === undefined) data.pos.showBarcodeOnReceipt = true;
    return data;
  }

  /**
   * Memperbarui informasi konfigurasi toko & pos
   * @param {Object} updatePayload
   * @returns {Promise<Object>}
   */
  static async update(updatePayload) {
    const current = await this.get();

    const merged = {
      store: {
        ...current.store,
        ...(updatePayload.store || {})
      },
      pos: {
        ...current.pos,
        ...(updatePayload.pos || {})
      }
    };

    await JsonStorage.write(this.filePath, merged);
    return merged;
  }

  /**
   * Memperbarui logo toko
   * @param {string} logoUrl 
   */
  static async updateLogo(logoUrl) {
    const current = await this.get();
    current.store.logoUrl = logoUrl;
    current.store.useLogoOnReceipt = true;
    await JsonStorage.write(this.filePath, current);
    return current;
  }
}

module.exports = StoreConfig;
