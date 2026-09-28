const pool = require('../config/database');

const createRiwayat = async (req, res) => {
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
      WHERE id=$7
    `, [umur_bulan, tinggi_badan, berat_badan, status, predicted_class ?? null, tanggal_pemeriksaan, anak_id]);

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

const getRiwayatByAnakId = async (req, res) => {
  const { anak_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM riwayat_pemeriksaan WHERE anak_id = $1 ORDER BY tanggal_pemeriksaan DESC, id DESC`,
      [anak_id]
    );
    res.json({ message: 'Riwayat pemeriksaan berhasil diambil', data: result.rows });
  } catch (error) {
    console.error('Gagal ambil riwayat:', error);
    res.status(500).json({ message: 'Gagal mengambil data riwayat' });
  }
};

const deleteRiwayatById = async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const deleted = await client.query(`DELETE FROM riwayat_pemeriksaan WHERE id = $1 RETURNING anak_id`, [id]);
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
        WHERE id=$7
      `, [item.umur_bulan, item.tinggi_badan, item.berat_badan, item.status, item.predicted_class, item.tanggal_pemeriksaan, anakId]);
    } else {
      await client.query(`
        UPDATE status_anak
        SET umur_bulan=NULL, tinggi_badan=NULL, berat_badan=NULL, label=NULL, predicted_class=NULL,
            last_checkup_at=NULL, updated_at=CURRENT_TIMESTAMP
        WHERE id=$1
      `, [anakId]);
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

module.exports = { createRiwayat, getRiwayatByAnakId, deleteRiwayatById };
