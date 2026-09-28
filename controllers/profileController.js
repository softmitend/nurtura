const pool = require('../config/database');

// GET - Ambil profil posyandu user yang login
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT * FROM posyandu_profile WHERE user_id = $1',
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
    const { nama_posyandu, alamat, foto_url, deskripsi } = req.body;

    // Cek apakah sudah ada profil
    const existing = await pool.query(
      'SELECT * FROM posyandu_profile WHERE user_id = $1',
      [userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Profil sudah ada, gunakan PUT untuk update' });
    }

    // Simpan profil baru
    await pool.query(
      `INSERT INTO posyandu_profile (user_id, nama_posyandu, alamat, foto_url, deskripsi)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, nama_posyandu, alamat, foto_url, deskripsi]
    );

    res.status(201).json({ message: '✅ Profil berhasil dibuat' });
  } catch (err) {
    console.error('❌ Error createProfile:', err.message);
    res.status(500).json({ message: 'Gagal membuat profil' });
  }
};

// PUT - Update profil posyandu
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nama_posyandu, alamat, foto_url, deskripsi } = req.body;

    await pool.query(
      `UPDATE posyandu_profile
       SET nama_posyandu = $1, alamat = $2, foto_url = $3, deskripsi = $4
       WHERE user_id = $5`,
      [nama_posyandu, alamat, foto_url, deskripsi, userId]
    );

    res.json({ message: '✅ Profil berhasil diperbarui' });
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
