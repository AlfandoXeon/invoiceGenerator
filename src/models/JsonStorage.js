const fs = require('fs');
const path = require('path');

/**
 * JsonStorage - OOP Utility untuk operasi baca & tulis file JSON lokal
 * Dilengkapi atomic write untuk mencegah korupsi file saat listrik padam mendadak
 */
class JsonStorage {
  /**
   * Membaca isi file JSON secara sinkron/asinkron dengan penanganan error
   * @param {string} filePath - Path absolut atau relatif ke file JSON
   * @param {*} defaultData - Data default jika file belum ada atau kosong
   * @returns {Promise<any>}
   */
  static async read(filePath, defaultData = null) {
    try {
      const resolvedPath = path.resolve(filePath);
      if (!fs.existsSync(resolvedPath)) {
        if (defaultData !== null) {
          await this.write(resolvedPath, defaultData);
          return defaultData;
        }
        return null;
      }

      const fileContent = await fs.promises.readFile(resolvedPath, 'utf-8');
      if (!fileContent.trim()) {
        return defaultData;
      }

      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`[JsonStorage] Gagal membaca ${filePath}:`, error.message);
      return defaultData;
    }
  }

  /**
   * Menulis data ke file JSON dengan teknik atomic write (write to temp file then rename)
   * @param {string} filePath - Path file target
   * @param {*} data - Data objek/array yang akan disimpan
   * @returns {Promise<boolean>}
   */
  static async write(filePath, data) {
    try {
      const resolvedPath = path.resolve(filePath);
      const dir = path.dirname(resolvedPath);

      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }

      const tempPath = `${resolvedPath}.tmp_${Date.now()}`;
      const jsonString = JSON.stringify(data, null, 2);

      // Tulis ke temp file terlebih dahulu
      await fs.promises.writeFile(tempPath, jsonString, 'utf-8');

      // Ganti nama file secara atomik (menggantikan file target)
      await fs.promises.rename(tempPath, resolvedPath);
      return true;
    } catch (error) {
      console.error(`[JsonStorage] Gagal menulis ${filePath}:`, error.message);
      return false;
    }
  }
}

module.exports = JsonStorage;
