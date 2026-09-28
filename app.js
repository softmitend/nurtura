require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { migrate } = require('./migrate');

const app = express();
const port = process.env.PORT || 5000;
const isVercel = Boolean(process.env.VERCEL);

app.use(cors());
app.use(express.json());

const riwayatRoutes = require('./routes/riwayatRoutes');
app.use('/api', riwayatRoutes);
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);
const anakRoutes = require('./routes/anakRoutes');
app.use('/api', anakRoutes);
const docRoutes = require('./routes/docRoutes');
app.use('/api', docRoutes);
const statistikRoutes = require('./routes/statistikRoutes');
app.use('/api', statistikRoutes);
const profileRoutes = require('./routes/profileRoutes');
app.use('/api/profile', profileRoutes);
const mlRoutes = require('./routes/mlRoutes');
app.use('/ml', mlRoutes);

// Vercel menyajikan folder public melalui CDN. Middleware ini tetap dibutuhkan
// ketika aplikasi dijalankan secara lokal dengan `npm start`.
if (!isVercel) {
  app.use('/public', express.static(path.join(__dirname, 'public')));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NURTURA API' });
});

if (!isVercel) {
  const frontendPublic = path.join(__dirname, 'public');
  app.use(express.static(frontendPublic));
  app.get(/^(?!\/(api|auth|ml|public)(\/|$)).*/, (req, res) => {
    res.sendFile(path.join(frontendPublic, 'index.html'));
  });
}

// Pastikan semua kegagalan API dikembalikan sebagai JSON, bukan halaman HTML Express.
app.use((err, req, res, next) => {
  console.error(`[SERVER] ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) return next(err);

  const status = Number(err.status || err.statusCode) || 500;
  const isApiRequest = /^(\/api|\/auth|\/ml)(\/|$)/.test(req.path);

  if (isApiRequest) {
    return res.status(status).json({
      error: true,
      message:
        status >= 500
          ? 'Server gagal memproses permintaan. Periksa koneksi database lalu coba lagi.'
          : err.message || 'Permintaan tidak dapat diproses.',
    });
  }

  return res.status(status).send('Terjadi kesalahan pada server.');
});

async function startServer() {
  try {
    // Migrasi otomatis hanya untuk server lokal. Di Vercel, jalankan `npm run migrate`
    // satu kali agar cold start fungsi tidak menjalankan DDL berulang kali.
    await migrate({ closePool: false });
    app.listen(port, () => {
      console.log(`NURTURA server berjalan di http://localhost:${port}`);
    });
  } catch (error) {
    console.error('[SERVER] Gagal menyiapkan database. Server tidak dijalankan.', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

// Vercel mendeteksi dan menjalankan instance Express yang diekspor ini.
module.exports = app;
