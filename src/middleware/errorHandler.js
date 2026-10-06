/**
 * Centralized Error & 404 Middleware
 * Membedakan respon JSON untuk rute API dan respon bersahabat untuk rute browser
 */

function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `Endpoint API "${req.method} ${req.originalUrl}" tidak ditemukan.`,
      code: 404
    });
  }

  // Untuk request halaman browser biasa, arahkan ke halaman utama
  res.redirect('/');
}

function globalErrorHandler(err, req, res, next) {
  console.error('[System Error]', {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  if (req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(statusCode).json({
      success: false,
      message,
      statusCode
    });
  }

  res.status(statusCode).send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Terjadi Kesalahan - Xeon POS</title>
      <link rel="stylesheet" href="/css/app.css">
    </head>
    <body class="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div class="pos-card p-8 max-w-md w-full text-center shadow-lg">
        <div class="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">!</div>
        <h2 class="text-lg font-bold mb-2">Terjadi Kesalahan Sistem</h2>
        <p class="text-xs text-slate-500 mb-6 leading-relaxed">${message}</p>
        <a href="/" class="pos-btn pos-btn-primary w-full">Kembali ke Menu Kasir</a>
      </div>
    </body>
    </html>
  `);
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
