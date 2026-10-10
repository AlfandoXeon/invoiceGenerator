const Database = require('./Database');

/**
 * Product Model - OOP Entity untuk katalog data produk dengan database SQLite 3
 */
class Product {
  /**
   * Mengambil semua produk dari SQLite 3
   * @returns {Promise<Array>}
   */
  static async getAll() {
    const list = await Database.all('SELECT * FROM products ORDER BY createdAt DESC;');
    return Array.isArray(list) ? list : [];
  }

  /**
   * Mencari produk berdasarkan ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    if (!id) return null;
    return await Database.get('SELECT * FROM products WHERE id = ?;', [String(id)]);
  }

  /**
   * Mencari produk berdasarkan barcode
   * @param {string} barcode
   * @returns {Promise<Object|null>}
   */
  static async getByBarcode(barcode) {
    if (!barcode) return null;
    return await Database.get('SELECT * FROM products WHERE barcode = ?;', [barcode.trim()]);
  }

  /**
   * Mencari produk berdasarkan kata kunci (nama, barcode, atau kategori)
   * @param {string} query
   * @returns {Promise<Array>}
   */
  static async search(query) {
    if (!query) return await this.getAll();

    const term = `%${query.trim().toLowerCase()}%`;
    return await Database.all(`
      SELECT * FROM products
      WHERE LOWER(name) LIKE ? OR LOWER(barcode) LIKE ? OR LOWER(category) LIKE ?
      ORDER BY createdAt DESC;
    `, [term, term, term]);
  }

  /**
   * Menambahkan produk baru ke SQLite 3
   * @param {Object} productData
   * @returns {Promise<Object>}
   */
  static async create(productData) {
    const newProduct = {
      id: `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      barcode: (productData.barcode || '').trim(),
      name: (productData.name || 'Produk Baru').trim(),
      category: (productData.category || 'Umum').trim(),
      costPrice: parseFloat(productData.costPrice) || 0,
      sellingPrice: parseFloat(productData.sellingPrice) || 0,
      unit: (productData.unit || 'Pcs').trim(),
      stock: parseInt(productData.stock, 10) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await Database.run(`
      INSERT INTO products (id, barcode, name, category, costPrice, sellingPrice, unit, stock, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newProduct.id,
      newProduct.barcode,
      newProduct.name,
      newProduct.category,
      newProduct.costPrice,
      newProduct.sellingPrice,
      newProduct.unit,
      newProduct.stock,
      newProduct.createdAt,
      newProduct.updatedAt
    ]);

    return newProduct;
  }

  /**
   * Memperbarui data produk
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  static async update(id, updateData) {
    const current = await this.getById(id);
    if (!current) return null;

    const updated = {
      barcode: updateData.barcode !== undefined ? updateData.barcode.trim() : current.barcode,
      name: updateData.name !== undefined ? updateData.name.trim() : current.name,
      category: updateData.category !== undefined ? updateData.category.trim() : current.category,
      costPrice: updateData.costPrice !== undefined ? parseFloat(updateData.costPrice) || 0 : current.costPrice,
      sellingPrice: updateData.sellingPrice !== undefined ? parseFloat(updateData.sellingPrice) || 0 : current.sellingPrice,
      unit: updateData.unit !== undefined ? updateData.unit.trim() : current.unit,
      stock: updateData.stock !== undefined ? parseInt(updateData.stock, 10) || 0 : current.stock,
      updatedAt: new Date().toISOString()
    };

    await Database.run(`
      UPDATE products SET
        barcode = ?,
        name = ?,
        category = ?,
        costPrice = ?,
        sellingPrice = ?,
        unit = ?,
        stock = ?,
        updatedAt = ?
      WHERE id = ?;
    `, [
      updated.barcode,
      updated.name,
      updated.category,
      updated.costPrice,
      updated.sellingPrice,
      updated.unit,
      updated.stock,
      updated.updatedAt,
      String(id)
    ]);

    return { ...current, ...updated };
  }

  /**
   * Menghapus produk
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await Database.run('DELETE FROM products WHERE id = ?;', [String(id)]);
    return result.changes > 0;
  }

  /**
   * Menambah stok barang masuk (Restock) dan opsi perbarui harga modal
   * @param {string} id - ID produk
   * @param {number} additionalQty - Jumlah stok yang masuk
   * @param {number|null} newCostPrice - Harga modal baru (opsional)
   * @returns {Promise<Object|null>}
   */
  static async restock(id, additionalQty, newCostPrice = null) {
    const current = await this.getById(id);
    if (!current) return null;

    const addQty = parseInt(additionalQty, 10) || 0;
    if (addQty <= 0) {
      throw new Error('Jumlah barang masuk harus lebih dari 0');
    }

    const updatedStock = (parseInt(current.stock, 10) || 0) + addQty;
    const cost = (newCostPrice !== null && newCostPrice !== undefined && newCostPrice !== '' && !isNaN(newCostPrice) && parseFloat(newCostPrice) >= 0)
      ? parseFloat(newCostPrice)
      : current.costPrice;
    const now = new Date().toISOString();

    await Database.run(`
      UPDATE products SET
        stock = ?,
        costPrice = ?,
        updatedAt = ?
      WHERE id = ?;
    `, [updatedStock, cost, now, String(id)]);

    return {
      ...current,
      stock: updatedStock,
      costPrice: cost,
      updatedAt: now
    };
  }

  /**
   * Memvalidasi ketersediaan stok produk untuk daftar item transaksi
   * @param {Array} items - Daftar item transaksi [{ id, name, qty }]
   * @returns {Promise<{ valid: boolean, errors: Array<string> }>}
   */
  static async validateStock(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return { valid: true, errors: [] };
    }

    const allProducts = await this.getAll();
    const errors = [];
    const aggregated = new Map();

    for (const item of items) {
      const qty = parseInt(item.qty, 10) || 0;
      if (qty <= 0) continue;

      let product = null;
      if (item.id || item.productId) {
        const sId = String(item.id || item.productId);
        product = allProducts.find(p => String(p.id) === sId);
      }
      if (!product && item.barcode) {
        const sBar = String(item.barcode).trim();
        product = allProducts.find(p => p.barcode && p.barcode.trim() === sBar);
      }
      if (!product && item.name) {
        const sName = String(item.name).trim().toLowerCase();
        product = allProducts.find(p => p.name && p.name.trim().toLowerCase() === sName);
      }

      if (product) {
        const entry = aggregated.get(product.id) || { product, totalQty: 0 };
        entry.totalQty += qty;
        aggregated.set(product.id, entry);
      }
    }

    for (const [, { product, totalQty }] of aggregated) {
      const available = parseInt(product.stock, 10) || 0;
      if (available <= 0) {
        errors.push(`Stok produk "${product.name}" telah habis (Sisa: 0 ${product.unit || 'Pcs'})`);
      } else if (totalQty > available) {
        errors.push(`Stok produk "${product.name}" tidak mencukupi. Tersedia: ${available} ${product.unit || 'Pcs'}, diminta: ${totalQty}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Mengurangi stok produk setelah transaksi berhasil diproses
   * @param {Array} items - Daftar item transaksi [{ id, name, qty }]
   * @returns {Promise<Array>} - Daftar produk yang stoknya berhasil dikurangi
   */
  static async deductStock(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const updatedProducts = [];
    const now = new Date().toISOString();

    for (const item of items) {
      const qty = parseInt(item.qty, 10) || 0;
      if (qty <= 0) continue;

      let prod = null;
      if (item.id || item.productId) {
        prod = await this.getById(item.id || item.productId);
      }
      if (!prod && item.barcode) {
        prod = await this.getByBarcode(item.barcode);
      }
      if (!prod && item.name) {
        prod = await Database.get('SELECT * FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?));', [item.name]);
      }

      if (prod) {
        const currentStock = parseInt(prod.stock, 10) || 0;
        const newStock = Math.max(0, currentStock - qty);
        await Database.run('UPDATE products SET stock = ?, updatedAt = ? WHERE id = ?;', [newStock, now, prod.id]);
        prod.stock = newStock;
        prod.updatedAt = now;
        updatedProducts.push(prod);
      }
    }

    return updatedProducts;
  }

  /**
   * Mengembalikan stok produk (misal saat transaksi dihapus dari riwayat)
   * @param {Array} items - Daftar item transaksi [{ id, name, qty }]
   * @returns {Promise<Array>} - Daftar produk yang stoknya dikembalikan
   */
  static async restoreStock(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    const updatedProducts = [];
    const now = new Date().toISOString();

    for (const item of items) {
      const qty = parseInt(item.qty, 10) || 0;
      if (qty <= 0) continue;

      let prod = null;
      if (item.id || item.productId) {
        prod = await this.getById(item.id || item.productId);
      }
      if (!prod && item.barcode) {
        prod = await this.getByBarcode(item.barcode);
      }
      if (!prod && item.name) {
        prod = await Database.get('SELECT * FROM products WHERE LOWER(TRIM(name)) = LOWER(TRIM(?));', [item.name]);
      }

      if (prod) {
        const currentStock = parseInt(prod.stock, 10) || 0;
        const newStock = currentStock + qty;
        await Database.run('UPDATE products SET stock = ?, updatedAt = ? WHERE id = ?;', [newStock, now, prod.id]);
        prod.stock = newStock;
        prod.updatedAt = now;
        updatedProducts.push(prod);
      }
    }

    return updatedProducts;
  }
}

module.exports = Product;
