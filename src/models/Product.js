const path = require('path');
const JsonStorage = require('./JsonStorage');

/**
 * Product Model - OOP Entity untuk katalog data produk lokal UMKM
 */
class Product {
  static get filePath() {
    return path.join(__dirname, '../../data/products.json');
  }

  /**
   * Mengambil semua produk
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const list = await JsonStorage.read(this.filePath, []);
    return Array.isArray(list) ? list : [];
  }

  /**
   * Mencari produk berdasarkan ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    const list = await this.getAll();
    return list.find(item => String(item.id) === String(id)) || null;
  }

  /**
   * Mencari produk berdasarkan barcode
   * @param {string} barcode
   * @returns {Promise<Object|null>}
   */
  static async getByBarcode(barcode) {
    if (!barcode) return null;
    const list = await this.getAll();
    return list.find(item => item.barcode === barcode.trim()) || null;
  }

  /**
   * Mencari produk berdasarkan kata kunci (nama atau barcode)
   * @param {string} query
   * @returns {Promise<Array>}
   */
  static async search(query) {
    const list = await this.getAll();
    if (!query) return list;

    const lower = query.toLowerCase().trim();
    return list.filter(item => 
      (item.name && item.name.toLowerCase().includes(lower)) ||
      (item.barcode && item.barcode.toLowerCase().includes(lower)) ||
      (item.category && item.category.toLowerCase().includes(lower))
    );
  }

  /**
   * Menambahkan produk baru
   * @param {Object} productData
   * @returns {Promise<Object>}
   */
  static async create(productData) {
    const list = await this.getAll();
    const newProduct = {
      id: `prod_${Date.now()}`,
      barcode: (productData.barcode || '').trim(),
      name: (productData.name || 'Produk Baru').trim(),
      category: (productData.category || 'Umum').trim(),
      costPrice: parseFloat(productData.costPrice) || 0,
      sellingPrice: parseFloat(productData.sellingPrice) || 0,
      unit: (productData.unit || 'Pcs').trim(),
      stock: parseInt(productData.stock) || 0,
      createdAt: new Date().toISOString()
    };

    list.unshift(newProduct);
    await JsonStorage.write(this.filePath, list);
    return newProduct;
  }

  /**
   * Memperbarui produk
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  static async update(id, updateData) {
    const list = await this.getAll();
    const index = list.findIndex(item => String(item.id) === String(id));
    if (index === -1) return null;

    const current = list[index];
    list[index] = {
      ...current,
      barcode: updateData.barcode !== undefined ? updateData.barcode.trim() : current.barcode,
      name: updateData.name !== undefined ? updateData.name.trim() : current.name,
      category: updateData.category !== undefined ? updateData.category.trim() : current.category,
      costPrice: updateData.costPrice !== undefined ? parseFloat(updateData.costPrice) || 0 : current.costPrice,
      sellingPrice: updateData.sellingPrice !== undefined ? parseFloat(updateData.sellingPrice) || 0 : current.sellingPrice,
      unit: updateData.unit !== undefined ? updateData.unit.trim() : current.unit,
      stock: updateData.stock !== undefined ? parseInt(updateData.stock) || 0 : current.stock,
      updatedAt: new Date().toISOString()
    };

    await JsonStorage.write(this.filePath, list);
    return list[index];
  }

  /**
   * Menghapus produk
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
}

module.exports = Product;
