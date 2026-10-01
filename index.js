const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

// Inisialisasi Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets Folder
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Konfigurasi EJS View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Import Routes
const cashierRoutes = require('./src/routes/cashierRoutes');
const configRoutes = require('./src/routes/configRoutes');
const productRoutes = require('./src/routes/productRoutes');
const historyRoutes = require('./src/routes/historyRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const guideRoutes = require('./src/routes/guideRoutes');

// Daftarkan Routes
app.use('/', cashierRoutes);
app.use('/', configRoutes);
app.use('/', productRoutes);
app.use('/', historyRoutes);
app.use('/', settingsRoutes);
app.use('/', guideRoutes);

// 404 Handler - Redirect ke halaman utama kasir
app.use((req, res) => {
  res.redirect('/');
});

// Jalankan Server Lokal
app.listen(PORT, () => {
  console.log('====================================================');
  console.log('  ⚡ XEON INVOICE GENERATOR - SERVER LOKAL SIAP ⚡');
  console.log('====================================================');
  console.log(`  🌐 Buka di browser: http://localhost:${PORT}`);
  console.log(`  📂 Database JSON lokal aktif di folder ./data`);
  console.log(`  🖨️  Mendukung Cetak Thermal 58mm/80mm & High-DPI PNG`);
  console.log('  Tekan Ctrl + C di terminal untuk mematikan server.');
  console.log('====================================================');
});
