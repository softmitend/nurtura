require('dotenv').config();
const pool = require('./config/database');

async function migrate({ closePool = true } = {}) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS anak (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        umur INT NOT NULL,
        tinggi FLOAT NOT NULL,
        berat FLOAT NOT NULL,
        jenis_kelamin VARCHAR(10) NOT NULL,
        hasil_prediksi VARCHAR(50)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS status_anak (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        jenis_kelamin VARCHAR(20) NOT NULL,
        umur_bulan INT,
        tinggi_badan FLOAT,
        berat_badan FLOAT,
        predicted_class INT,
        label VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // status_anak dipertahankan sebagai master data anak agar endpoint lama tetap kompatibel.
    // Kolom pengukuran di tabel ini hanya menyimpan snapshot pemeriksaan TERBARU.
    await pool.query(`
      ALTER TABLE status_anak
      ADD COLUMN IF NOT EXISTS user_id INTEGER,
      ADD COLUMN IF NOT EXISTS nomor_identitas VARCHAR(80),
      ADD COLUMN IF NOT EXISTS nama_orang_tua VARCHAR(255),
      ADD COLUMN IF NOT EXISTS alamat TEXT,
      ADD COLUMN IF NOT EXISTS no_telepon_orang_tua VARCHAR(30),
      ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
      ADD COLUMN IF NOT EXISTS posyandu VARCHAR(100),
      ADD COLUMN IF NOT EXISTS foto_url TEXT,
      ADD COLUMN IF NOT EXISTS last_checkup_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'status_anak_user_id_fkey'
            AND conrelid = 'status_anak'::regclass
        ) THEN
          ALTER TABLE status_anak
          ADD CONSTRAINT status_anak_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES admin(id) ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    const legacyOwnerId = Number(process.env.LEGACY_DATA_OWNER_ID);
    if (Number.isInteger(legacyOwnerId) && legacyOwnerId > 0) {
      const owner = await pool.query('SELECT id FROM admin WHERE id = $1', [legacyOwnerId]);
      if (owner.rowCount === 0) {
        throw new Error(`LEGACY_DATA_OWNER_ID ${legacyOwnerId} tidak ditemukan.`);
      }
      await pool.query(
        'UPDATE status_anak SET user_id = $1 WHERE user_id IS NULL',
        [legacyOwnerId]
      );
    }

    // Instalasi lama memiliki tiga kolom pemeriksaan sebagai NOT NULL.
    // Data anak baru harus dapat dibuat sebelum pemeriksaan pertama dilakukan.
    await pool.query(`
      ALTER TABLE status_anak
      ALTER COLUMN umur_bulan DROP NOT NULL,
      ALTER COLUMN tinggi_badan DROP NOT NULL,
      ALTER COLUMN berat_badan DROP NOT NULL;
    `);

    await pool.query('DROP INDEX IF EXISTS idx_status_anak_nomor_identitas_unique;');
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_status_anak_user_nomor_identitas_unique
      ON status_anak (user_id, nomor_identitas)
      WHERE user_id IS NOT NULL
        AND nomor_identitas IS NOT NULL
        AND nomor_identitas <> '';
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_status_anak_user_id
      ON status_anak (user_id);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS riwayat_pemeriksaan (
        id SERIAL PRIMARY KEY,
        anak_id INT REFERENCES status_anak(id) ON DELETE CASCADE,
        tanggal_pemeriksaan DATE NOT NULL,
        tinggi_badan FLOAT NOT NULL,
        berat_badan FLOAT NOT NULL,
        umur_bulan INT NOT NULL,
        status VARCHAR(50) NOT NULL
      );
    `);

    await pool.query(`
      ALTER TABLE riwayat_pemeriksaan
      ADD COLUMN IF NOT EXISTS predicted_class INT,
      ADD COLUMN IF NOT EXISTS lingkar_kepala FLOAT,
      ADD COLUMN IF NOT EXISTS catatan TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // Data lama sebelumnya hanya memiliki satu snapshot pengukuran di status_anak.
    // Salin snapshot tersebut ke riwayat sekali saja agar tidak hilang setelah model baru dipakai.
    await pool.query(`
      INSERT INTO riwayat_pemeriksaan
        (anak_id, tanggal_pemeriksaan, tinggi_badan, berat_badan, umur_bulan, status, predicted_class)
      SELECT
        s.id,
        COALESCE(s.last_checkup_at::date, s.created_at::date, CURRENT_DATE),
        s.tinggi_badan,
        s.berat_badan,
        s.umur_bulan,
        COALESCE(s.label, 'Belum diklasifikasi'),
        s.predicted_class
      FROM status_anak s
      WHERE s.tinggi_badan IS NOT NULL
        AND s.berat_badan IS NOT NULL
        AND s.umur_bulan IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM riwayat_pemeriksaan r
          WHERE r.anak_id = s.id
            AND r.tinggi_badan = s.tinggi_badan
            AND r.berat_badan = s.berat_badan
            AND r.umur_bulan = s.umur_bulan
        );
    `);

    await pool.query(`
      UPDATE status_anak
      SET last_checkup_at = COALESCE(last_checkup_at, created_at)
      WHERE last_checkup_at IS NULL
        AND tinggi_badan IS NOT NULL
        AND berat_badan IS NOT NULL;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_riwayat_pemeriksaan_anak_tanggal
      ON riwayat_pemeriksaan (anak_id, tanggal_pemeriksaan DESC, id DESC);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS posyandu_profile (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES admin(id) ON DELETE CASCADE,
        nama_posyandu VARCHAR(100),
        alamat TEXT
      );
    `);

    await pool.query(`
      ALTER TABLE posyandu_profile
      ADD COLUMN IF NOT EXISTS foto_url TEXT,
      ADD COLUMN IF NOT EXISTS deskripsi TEXT,
      ADD COLUMN IF NOT EXISTS desa_kelurahan VARCHAR(150);
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS posyandu_user (
        id SERIAL PRIMARY KEY,
        nama_posyandu VARCHAR(100) NOT NULL,
        alamat TEXT,
        username VARCHAR(100) NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);

    console.log('✅ Semua migrasi database berhasil dijalankan.');
  } catch (err) {
    console.error('❌ Gagal migrasi:', err);
    throw err;
  } finally {
    if (closePool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  migrate().catch(() => {
    process.exitCode = 1;
  });
}

module.exports = { migrate };
