/**
 * BaseController - Class Induk OOP Controller
 */
class BaseController {
  /**
   * Mengirim respon JSON sukses berstandar
   * @param {Object} res - Express response
   * @param {*} data - Payload data
   * @param {string} message - Pesan sukses
   * @param {number} status - Status HTTP
   */
  sendSuccess(res, data = null, message = 'Berhasil', status = 200) {
    return res.status(status).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Mengirim respon JSON gagal berstandar
   * @param {Object} res - Express response
   * @param {string} message - Pesan error
   * @param {number} status - Status HTTP
   * @param {*} errors - Rincian error tambahan
   */
  sendError(res, message = 'Terjadi kesalahan sistem', status = 500, errors = null) {
    return res.status(status).json({
      success: false,
      message,
      errors
    });
  }

  /**
   * Helper format mata uang Rupiah
   * @param {number} num 
   * @returns {string}
   */
  formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num || 0);
  }
}

module.exports = BaseController;
