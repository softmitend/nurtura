const assert = require('assert/strict');
const crypto = require('crypto');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL test belum dikonfigurasi.');
}

process.env.JWT_SECRET ||= crypto.randomBytes(32).toString('hex');
process.env.VERCEL = '1';

const app = require('../app');
const pool = require('../config/database');
const { migrate } = require('../migrate');

const suffix = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

const run = async () => {
  await migrate({ closePool: false });

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const request = async (path, { method = 'GET', token, body } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };

  const usernameA = `isolation-a-${suffix}`;
  const usernameB = `isolation-b-${suffix}`;
  const password = `Secure-${suffix}`;

  try {
    for (const username of [usernameA, usernameB]) {
      const registered = await request('/auth/register', {
        method: 'POST',
        body: { username, password },
      });
      assert.equal(registered.status, 201);
    }

    const login = async (username) => {
      const result = await request('/auth/login', {
        method: 'POST',
        body: { username, password },
      });
      assert.equal(result.status, 200);
      return result.body.loginResult.token;
    };

    const tokenA = await login(usernameA);
    const tokenB = await login(usernameB);
    const identityNumber = `SEC-${suffix}`;
    const childPayload = {
      nama: 'Anak Uji Isolasi',
      nomor_identitas: identityNumber,
      jenis_kelamin: 'perempuan',
      tanggal_lahir: '2024-01-01',
      nama_orang_tua: 'Orang Tua Uji',
      alamat: 'Alamat pengujian',
      no_telepon_orang_tua: '0800000000',
      posyandu: 'Posyandu Uji',
    };

    const createdA = await request('/api/status-anak', {
      method: 'POST', token: tokenA, body: childPayload,
    });
    assert.equal(createdA.status, 201);
    const childAId = createdA.body.data.id;

    const listBInitially = await request('/api/status-anak', { token: tokenB });
    assert.equal(listBInitially.status, 200);
    assert.deepEqual(listBInitially.body.data, []);

    const readAAsB = await request(`/api/status-anak/${childAId}`, { token: tokenB });
    assert.equal(readAAsB.status, 404);

    const updateAAsB = await request(`/api/status-anak/${childAId}`, {
      method: 'PUT', token: tokenB, body: { ...childPayload, nama: 'Tidak boleh berubah' },
    });
    assert.equal(updateAAsB.status, 404);

    const createdB = await request('/api/status-anak', {
      method: 'POST', token: tokenB, body: { ...childPayload, nama: 'Anak Milik B' },
    });
    assert.equal(createdB.status, 201);
    const childBId = createdB.body.data.id;
    assert.notEqual(childAId, childBId);

    const historyA = await request('/api/riwayat', {
      method: 'POST',
      token: tokenA,
      body: {
        anak_id: childAId,
        tanggal_pemeriksaan: '2026-09-28',
        tinggi_badan: 80,
        berat_badan: 10,
        umur_bulan: 32,
        status: 'Normal',
        predicted_class: 1,
      },
    });
    assert.equal(historyA.status, 201);
    const historyAId = historyA.body.data.id;

    const historyAAsB = await request(`/api/riwayat/${childAId}`, { token: tokenB });
    assert.equal(historyAAsB.status, 200);
    assert.deepEqual(historyAAsB.body.data, []);

    const deleteHistoryAAsB = await request(`/api/riwayat/${historyAId}`, {
      method: 'DELETE', token: tokenB,
    });
    assert.equal(deleteHistoryAAsB.status, 404);

    const predictAAsB = await request('/ml/predict', {
      method: 'POST',
      token: tokenB,
      body: {
        anak_id: childAId,
        tanggal_pemeriksaan: '2026-09-28',
        tinggi_badan: 80,
        berat_badan: 10,
      },
    });
    assert.equal(predictAAsB.status, 404);

    const statsA = await request('/api/statistik', { token: tokenA });
    const statsB = await request('/api/statistik', { token: tokenB });
    assert.equal(statsA.status, 200);
    assert.equal(statsB.status, 200);
    assert.ok(Object.keys(statsA.body.data).length > 0);
    assert.deepEqual(statsB.body.data, {});

    const deleteAAsB = await request(`/api/status-anak/${childAId}`, {
      method: 'DELETE', token: tokenB,
    });
    assert.equal(deleteAAsB.status, 404);

    const stillOwnedByA = await request(`/api/status-anak/${childAId}`, { token: tokenA });
    assert.equal(stillOwnedByA.status, 200);

    for (const [id, token] of [[childAId, tokenA], [childBId, tokenB]]) {
      const deleted = await request(`/api/status-anak/${id}`, { method: 'DELETE', token });
      assert.equal(deleted.status, 200);
    }

    console.log('Data isolation integration test passed for two independent accounts.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.query('DELETE FROM admin WHERE username = ANY($1)', [[usernameA, usernameB]]);
    await pool.end();
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
