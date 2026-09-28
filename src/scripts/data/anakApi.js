const BASE_URL = '';

async function readJsonResponse(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    throw new Error(response.ok ? fallbackMessage : `Server mengembalikan respons yang tidak valid (${response.status}). ${text.slice(0, 80)}`);
  }
  if (!response.ok) throw new Error(data.message || data.error || fallbackMessage);
  return data;
}

export async function getAnakList(token) {
  const res = await fetch(`${BASE_URL}/api/status-anak`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await readJsonResponse(res, 'Gagal mengambil data anak');
  return result.data || [];
}

export async function tambahAnak(token, anakData) {
  const res = await fetch(`${BASE_URL}/api/status-anak`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(anakData),
  });
  const result = await readJsonResponse(res, 'Gagal menambahkan data anak');
  return result.data;
}

export async function getAnakById(token, id) {
  const res = await fetch(`${BASE_URL}/api/status-anak/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await readJsonResponse(res, 'Gagal mengambil detail anak');
  return result.data;
}

export async function updateAnakById(token, id, anakData) {
  const res = await fetch(`${BASE_URL}/api/status-anak/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(anakData),
  });
  const result = await readJsonResponse(res, 'Gagal memperbarui identitas anak');
  return result.data;
}

export async function tambahPemeriksaan(token, payload) {
  const res = await fetch(`${BASE_URL}/ml/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const result = await readJsonResponse(res, 'Gagal menambahkan pemeriksaan anak');
  return result.data;
}

export async function deleteAnakById(token, id) {
  const res = await fetch(`${BASE_URL}/api/status-anak/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await readJsonResponse(res, 'Gagal menghapus data anak');
  return result.message;
}
