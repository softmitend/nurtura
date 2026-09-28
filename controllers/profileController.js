const pool = require('../config/database');

// Deployment lama mungkin belum memiliki field profil terbaru.
// Pastikan schema minimum tersedia sebelum endpoint profil membaca/menulis data.
const ensureProfileSchema = async () => {
  await pool.query(`
    ALTER TABLE posyandu_profile
    ADD COLUMN IF NOT EXISTS desa_kelurahan VARCHAR(150),
    ADD COLUMN IF NOT EXISTS foto_url TEXT,
    ADD COLUMN IF NOT EXISTS deskripsi TEXT;
  `);
};

// GET - Ambil profil posyandu user yang login
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    await ensureProfileSchema();

    const result = await pool.query(
      `SELECT p.*, a.username
       FROM posyandu_profile p
       INNER JOIN admin a ON a.id = p.user_id
       WHERE p.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: 'Belum ada profil posyandu',
        data: null
      });
    }

    res.json({
      message: '✅ Profil ditemukan',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Error getProfile:', err.message);
    res.status(500).json({ message: 'Gagal mengambil profil' });
  }
};

// POST - Buat profil posyandu baru
const createProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nama_posyandu, alamat, desa_kelurahan, foto_url, deskripsi } = req.body;
    await ensureProfileSchema();

    const existing = await pool.query(
      'SELECT * FROM posyandu_profile WHERE user_id = $1',
      [userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Profil sudah ada, gunakan PUT untuk update' });
    }

    const result = await pool.query(
      `INSERT INTO posyandu_profile (user_id, nama_posyandu, alamat, desa_kelurahan, foto_url, deskripsi)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        nama_posyandu,
        alamat,
        desa_kelurahan?.trim() || null,
        foto_url || null,
        deskripsi || null,
      ]
    );

    res.status(201).json({ message: '✅ Profil berhasil dibuat', data: result.rows[0] });
  } catch (err) {
    console.error('❌ Error createProfile:', err.message);
    res.status(500).json({ message: 'Gagal membuat profil' });
  }
};

// PUT - Update profil posyandu
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nama_posyandu, alamat, desa_kelurahan, foto_url, deskripsi } = req.body;
    await ensureProfileSchema();

    const result = await pool.query(
      `UPDATE posyandu_profile
       SET nama_posyandu = $1,
           alamat = $2,
           desa_kelurahan = $3,
           foto_url = $4,
           deskripsi = $5
       WHERE user_id = $6
       RETURNING *`,
      [
        nama_posyandu,
        alamat,
        desa_kelurahan?.trim() || null,
        foto_url || null,
        deskripsi || null,
        userId,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Profil Posyandu tidak ditemukan' });
    }

    res.json({ message: '✅ Profil berhasil diperbarui', data: result.rows[0] });
  } catch (err) {
    console.error('❌ Error updateProfile:', err.message);
    res.status(500).json({ message: 'Gagal mengupdate profil' });
  }
};

module.exports = {
  getProfile,
  createProfile,
  updateProfile
};
