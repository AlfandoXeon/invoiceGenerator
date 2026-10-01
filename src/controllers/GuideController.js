const BaseController = require('./BaseController');
const StoreConfig = require('../models/StoreConfig');

/**
 * GuideController - Menampilkan panduan dan tutorial penggunaan aplikasi di dalam web
 */
class GuideController extends BaseController {
  constructor() {
    super();
    this.renderGuidePage = this.renderGuidePage.bind(this);
  }

  async renderGuidePage(req, res) {
    try {
      const config = await StoreConfig.get();
      res.render('pages/guide', {
        title: 'Buku Panduan Penggunaan - Xeon Invoice Generator',
        page: 'guide',
        config
      });
    } catch (error) {
      console.error('[GuideController] Error renderGuidePage:', error);
      res.status(500).send('Gagal memuat panduan: ' + error.message);
    }
  }
}

module.exports = new GuideController();
