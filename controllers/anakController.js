const pool = require('../config/database');

const normalizePhone = (value) => String(value || '').trim();

const getAllStatusAnak = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM status_anak
      ORDER BY nama ASC, created_at DESC
    `);
    res.json({ message: 'Data anak berhasil diambil', data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data anak' });
  }
};

const getAnakById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM status_anak WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Data anak tidak ditemukan' });
    }
    res.json({ message: 'Data anak berhasil ditemukan', data: result.rows[0] });
  } catch (error) {
    console.error('Gagal mengambil data anak:', error);
    res.status(500).json({ message: 'Gagal mengambil data anak' });
  }
};

const createAnak = async (req, res) => {
  const {
    nama,
    nomor_identitas,
    jenis_kelamin,
    tanggal_lahir,
    nama_orang_tua,
    alamat,
    no_telepon_orang_tua,
    posyandu,
    foto_url,
  } = req.body || {};

  if (!nama || !nomor_identitas || !jenis_kelamin || !tanggal_lahir || !nama_orang_tua || !alamat || !no_telepon_orang_tua) {
    return res.status(400).json({
      message: 'Nama lengkap, nomor identitas, jenis kelamin, tanggal lahir, nama orang tua/wali, alamat, dan nomor telepon wajib diisi.',
    });
  }

  try {
    const result = await pool.query(`
      INSERT INTO status_anak (
        nama,
        nomor_identitas,
        jenis_kelamin,
        tanggal_lahir,
        nama_orang_tua,
        alamat,
        no_telepon_orang_tua,
        posyandu,
        foto_url,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      String(nama).trim(),
      String(nomor_identitas).trim(),
      jenis_kelamin,
      tanggal_lahir,
      String(nama_orang_tua).trim(),
      String(alamat).trim(),
      normalizePhone(no_telepon_orang_tua),
      posyandu ? String(posyandu).trim() : null,
      foto_url || null,
    ]);

    res.status(201).json({
      message: 'Data identitas anak berhasil disimpan',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Gagal menambahkan data anak:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Nomor identitas tersebut sudah terdaftar.' });
    }
    res.status(500).json({ message: 'Gagal menambahkan data anak' });
  }
};

const updateAnakById = async (req, res) => {
  const { id } = req.params;
  const {
    nama,
    nomor_identitas,
    jenis_kelamin,
    tanggal_lahir,
    nama_orang_tua,
    alamat,
    no_telepon_orang_tua,
    posyandu,
    foto_url,
  } = req.body || {};

  if (!nama || !nomor_identitas || !jenis_kelamin || !tanggal_lahir || !nama_orang_tua || !alamat || !no_telepon_orang_tua) {
    return res.status(400).json({ message: 'Data identitas anak belum lengkap.' });
  }

  try {
    const result = await pool.query(`
      UPDATE status_anak
      SET nama = $1,
          nomor_identitas = $2,
          jenis_kelamin = $3,
          tanggal_lahir = $4,
          nama_orang_tua = $5,
          alamat = $6,
          no_telepon_orang_tua = $7,
          posyandu = $8,
          foto_url = $9,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [
      String(nama).trim(),
      String(nomor_identitas).trim(),
      jenis_kelamin,
      tanggal_lahir,
      String(nama_orang_tua).trim(),
      String(alamat).trim(),
      normalizePhone(no_telepon_orang_tua),
      posyandu ? String(posyandu).trim() : null,
      foto_url || null,
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Data anak tidak ditemukan' });
    }

    res.json({ message: 'Identitas anak berhasil diperbarui', data: result.rows[0] });
  } catch (error) {
    console.error('Gagal update data anak:', error);
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Nomor identitas tersebut sudah digunakan anak lain.' });
    }
    res.status(500).json({ message: 'Gagal memperbarui data anak' });
  }
};

const deleteAnakById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM status_anak WHERE id = $1`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Data anak tidak ditemukan' });
    }
    res.json({ message: 'Data anak dan seluruh riwayat pemeriksaannya berhasil dihapus' });
  } catch (error) {
    console.error('Gagal hapus data anak:', error);
    res.status(500).json({ message: 'Gagal menghapus data anak' });
  }
};

module.exports = {
  getAllStatusAnak,
  getAnakById,
  createAnak,
  updateAnakById,
  deleteAnakById,
};
