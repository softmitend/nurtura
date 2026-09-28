const pool = require('../config/database');

const createRiwayat = async (req, res) => {
  const userId = req.user.userId;
  const {
    anak_id,
    tanggal_pemeriksaan,
    tinggi_badan,
    berat_badan,
    umur_bulan,
    status,
    predicted_class,
    lingkar_kepala,
    catatan,
  } = req.body;

  if (!anak_id || !tanggal_pemeriksaan || tinggi_badan == null || berat_badan == null || umur_bulan == null || !status) {
    return res.status(400).json({ message: 'Field pemeriksaan belum lengkap' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const ownedChild = await client.query(
      `SELECT id FROM status_anak WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [anak_id, userId]
    );
    if (ownedChild.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Data anak tidak ditemukan' });
    }

    const result = await client.query(`
      INSERT INTO riwayat_pemeriksaan
      (anak_id, tanggal_pemeriksaan, tinggi_badan, berat_badan, umur_bulan, status, predicted_class, lingkar_kepala, catatan)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [anak_id, tanggal_pemeriksaan, tinggi_badan, berat_badan, umur_bulan, status, predicted_class ?? null, lingkar_kepala ?? null, catatan ?? null]);

    await client.query(`
      UPDATE status_anak
      SET umur_bulan=$1, tinggi_badan=$2, berat_badan=$3, label=$4, predicted_class=$5,
          last_checkup_at=$6, updated_at=CURRENT_TIMESTAMP
      WHERE id=$7 AND user_id=$8
    `, [umur_bulan, tinggi_badan, berat_badan, status, predicted_class ?? null, tanggal_pemeriksaan, anak_id, userId]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Riwayat pemeriksaan berhasil ditambahkan', data: result.rows[0] });
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (_) {}
    }
    console.error('Gagal tambah riwayat:', error);
    res.status(500).json({ message: 'Gagal menambahkan riwayat' });
  } finally {
    if (client) client.release();
  }
};

const getRiwayatReport = async (req, res) => {
  const userId = req.user.userId;
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.anak_id,
        r.tanggal_pemeriksaan,
        r.tinggi_badan,
        r.berat_badan,
        r.umur_bulan,
        r.status,
        r.predicted_class,
        r.lingkar_kepala,
        r.catatan,
        r.created_at,
        s.nama,
        s.nomor_identitas,
        s.jenis_kelamin,
        s.tanggal_lahir,
        s.nama_orang_tua,
        s.alamat,
        s.no_telepon_orang_tua,
        s.posyandu
      FROM riwayat_pemeriksaan r
      INNER JOIN status_anak s ON s.id = r.anak_id
      WHERE s.user_id = $1
      ORDER BY r.tanggal_pemeriksaan DESC, r.id DESC
    `, [userId]);

    res.json({
      message: 'Data laporan pemeriksaan berhasil diambil',
      data: result.rows,
    });
  } catch (error) {
    console.error('Gagal ambil laporan pemeriksaan:', error);
    res.status(500).json({ message: 'Gagal mengambil data laporan pemeriksaan' });
  }
};

const getRiwayatByAnakId = async (req, res) => {
  const { anak_id } = req.params;
  const userId = req.user.userId;
  try {
    const result = await pool.query(
      `SELECT r.*
       FROM riwayat_pemeriksaan r
       INNER JOIN status_anak s ON s.id = r.anak_id
       WHERE r.anak_id = $1 AND s.user_id = $2
       ORDER BY r.tanggal_pemeriksaan DESC, r.id DESC`,
      [anak_id, userId]
    );
    res.json({ message: 'Riwayat pemeriksaan berhasil diambil', data: result.rows });
  } catch (error) {
    console.error('Gagal ambil riwayat:', error);
    res.status(500).json({ message: 'Gagal mengambil data riwayat' });
  }
};

const deleteRiwayatById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const deleted = await client.query(`
      DELETE FROM riwayat_pemeriksaan r
      USING status_anak s
      WHERE r.id = $1
        AND r.anak_id = s.id
        AND s.user_id = $2
      RETURNING r.anak_id
    `, [id, userId]);
    if (deleted.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Riwayat tidak ditemukan' });
    }

    const anakId = deleted.rows[0].anak_id;
    const latest = await client.query(`
      SELECT * FROM riwayat_pemeriksaan
      WHERE anak_id = $1
      ORDER BY tanggal_pemeriksaan DESC, id DESC
      LIMIT 1
    `, [anakId]);

    if (latest.rows.length) {
      const item = latest.rows[0];
      await client.query(`
        UPDATE status_anak
        SET umur_bulan=$1, tinggi_badan=$2, berat_badan=$3, label=$4, predicted_class=$5,
            last_checkup_at=$6, updated_at=CURRENT_TIMESTAMP
        WHERE id=$7 AND user_id=$8
      `, [item.umur_bulan, item.tinggi_badan, item.berat_badan, item.status, item.predicted_class, item.tanggal_pemeriksaan, anakId, userId]);
    } else {
      await client.query(`
        UPDATE status_anak
        SET umur_bulan=NULL, tinggi_badan=NULL, berat_badan=NULL, label=NULL, predicted_class=NULL,
            last_checkup_at=NULL, updated_at=CURRENT_TIMESTAMP
        WHERE id=$1 AND user_id=$2
      `, [anakId, userId]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Riwayat berhasil dihapus' });
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (_) {}
    }
    console.error('Gagal hapus riwayat:', error);
    res.status(500).json({ message: 'Gagal menghapus riwayat' });
  } finally {
    if (client) client.release();
  }
};

module.exports = { createRiwayat, getRiwayatReport, getRiwayatByAnakId, deleteRiwayatById };
