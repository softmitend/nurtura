const pool = require('../config/database');
let tf = null;
let model = null;
let modelPromise = null;

const GENDER_MAP = {
  'laki-laki': 0,
  perempuan: 1,
};

const LABEL_MAP = {
  0: 'Berpotensi Stunting',
  1: 'Normal',
  2: 'Stunting',
};

const mean = [0.5, 16, 75, 8];
const std = [0.5, 4, 5, 1];
const standardize = (val, avg, deviation) => (val - avg) / deviation;

const loadModel = async () => {
  if (model) return model;

  if (!modelPromise) {
    modelPromise = (async () => {
      // Muat TensorFlow dan artefak model hanya ketika endpoint prediksi dipakai.
      // Endpoint lain tetap dapat hidup walaupun model gagal dimuat.
      tf = require('@tensorflow/tfjs');

      if (process.env.ML_MODEL_URL) {
        return tf.loadGraphModel(process.env.ML_MODEL_URL);
      }

      const fs = require('fs');
      const modelJson = require('../public/ml-model/model/model.json');
      const weightsBuffer = fs.readFileSync(
        require.resolve('../public/ml-model/model/group1-shard1of1.bin')
      );
      const weightData = weightsBuffer.buffer.slice(
        weightsBuffer.byteOffset,
        weightsBuffer.byteOffset + weightsBuffer.byteLength
      );
      const modelArtifacts = {
        modelTopology: modelJson.modelTopology,
        format: modelJson.format,
        generatedBy: modelJson.generatedBy,
        convertedBy: modelJson.convertedBy,
        signature: modelJson.signature,
        weightSpecs: modelJson.weightsManifest.flatMap((group) => group.weights),
        weightData,
      };

      return tf.loadGraphModel(tf.io.fromMemory(modelArtifacts));
    })()
      .then((loadedModel) => {
        model = loadedModel;
        console.log('✅ ML model loaded');
        return model;
      })
      .catch((error) => {
        modelPromise = null;
        throw error;
      });
  }

  return modelPromise;
};

const calculateAgeMonths = (birthDateValue, examinationDateValue) => {
  if (!birthDateValue) return null;
  const birth = new Date(`${String(birthDateValue).slice(0, 10)}T00:00:00`);
  const exam = new Date(`${String(examinationDateValue).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(exam.getTime()) || exam < birth) return null;

  let months = (exam.getFullYear() - birth.getFullYear()) * 12 + exam.getMonth() - birth.getMonth();
  if (exam.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
};

const predictData = async (req, res) => {
  const userId = req.user.userId;
  const input = Array.isArray(req.body) ? req.body[0] : req.body;
  const {
    anak_id,
    tanggal_pemeriksaan,
    tinggi_badan,
    berat_badan,
    lingkar_kepala,
    catatan,
    umur_bulan: legacyAge,
  } = input || {};

  if (!anak_id || !tanggal_pemeriksaan || tinggi_badan == null || berat_badan == null) {
    return res.status(400).json({
      message: 'Anak, tanggal pemeriksaan, tinggi badan, dan berat badan wajib diisi.',
    });
  }

  let inputTensor;
  let prediction;
  let client;

  try {
    const childResult = await pool.query(
      'SELECT * FROM status_anak WHERE id = $1 AND user_id = $2',
      [anak_id, userId]
    );
    if (!childResult.rows.length) {
      return res.status(404).json({ message: 'Data anak tidak ditemukan.' });
    }

    const child = childResult.rows[0];
    const ageMonths = calculateAgeMonths(child.tanggal_lahir, tanggal_pemeriksaan) ?? Number(legacyAge);
    if (!Number.isFinite(ageMonths) || ageMonths < 0) {
      return res.status(400).json({
        message: 'Umur anak tidak dapat dihitung. Lengkapi tanggal lahir anak terlebih dahulu.',
      });
    }

    const height = Number(tinggi_badan);
    const weight = Number(berat_badan);
    if (!Number.isFinite(height) || !Number.isFinite(weight) || height <= 0 || weight <= 0) {
      return res.status(400).json({ message: 'Tinggi dan berat badan harus berupa angka yang valid.' });
    }

    await loadModel();

    const genderNumeric = GENDER_MAP[String(child.jenis_kelamin || '').toLowerCase()] ?? 0;
    const standardized = [genderNumeric, ageMonths, height, weight]
      .map((value, index) => standardize(value, mean[index], std[index]));

    inputTensor = tf.tensor2d([standardized], [1, 4]);
    prediction = model.predict(inputTensor);
    const probabilities = await prediction.data();
    const predictedClass = probabilities.indexOf(Math.max(...probabilities));
    const predictedLabel = LABEL_MAP[predictedClass];

    client = await pool.connect();
    await client.query('BEGIN');

    const historyResult = await client.query(`
      INSERT INTO riwayat_pemeriksaan (
        anak_id,
        tanggal_pemeriksaan,
        tinggi_badan,
        berat_badan,
        umur_bulan,
        status,
        predicted_class,
        lingkar_kepala,
        catatan
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      anak_id,
      tanggal_pemeriksaan,
      height,
      weight,
      ageMonths,
      predictedLabel,
      predictedClass,
      lingkar_kepala === '' || lingkar_kepala == null ? null : Number(lingkar_kepala),
      catatan ? String(catatan).trim() : null,
    ]);

    await client.query(`
      UPDATE status_anak
      SET umur_bulan = $1,
          tinggi_badan = $2,
          berat_badan = $3,
          predicted_class = $4,
          label = $5,
          last_checkup_at = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND user_id = $8
    `, [ageMonths, height, weight, predictedClass, predictedLabel, tanggal_pemeriksaan, anak_id, userId]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Pemeriksaan berhasil disimpan tanpa menghapus riwayat sebelumnya.',
      data: {
        ...historyResult.rows[0],
        nama: child.nama,
        jenis_kelamin: child.jenis_kelamin,
      },
    });
  } catch (error) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch (_) {}
    }
    console.error('❌ Gagal menyimpan pemeriksaan:', error);
    res.status(500).json({ message: 'Gagal memproses dan menyimpan pemeriksaan anak.' });
  } finally {
    if (inputTensor) inputTensor.dispose();
    if (prediction && typeof prediction.dispose === 'function') prediction.dispose();
    if (client) client.release();
  }
};

module.exports = { predictData };
