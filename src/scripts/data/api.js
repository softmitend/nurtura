import CONFIG from '../config.js';

const ENDPOINTS = {
  LOGIN: `${CONFIG.BASE_URL}/auth/login`,
  REGISTER: `${CONFIG.BASE_URL}/auth/register`,
};

async function requestJson(url, options, fallbackMessage) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error('Tidak dapat terhubung ke server. Pastikan backend NURTURA sedang berjalan.');
  }

  const contentType = response.headers.get('content-type') || '';
  const raw = await response.text();
  let data = {};

  if (raw) {
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error('Respons JSON dari server tidak valid.');
      }
    } else {
      // Beberapa proxy/server dapat mengirim JSON tanpa header yang benar.
      try {
        data = JSON.parse(raw);
      } catch {
        if (!response.ok) {
          throw new Error(`${fallbackMessage}. Server mengembalikan respons non-JSON (HTTP ${response.status}).`);
        }
        throw new Error('Server mengembalikan respons yang tidak dikenali.');
      }
    }
  }

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

export async function login({ username, password }) {
  return requestJson(
    ENDPOINTS.LOGIN,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    },
    'Login gagal'
  );
}

export async function register({ username, password }) {
  return requestJson(
    ENDPOINTS.REGISTER,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    },
    'Registrasi gagal'
  );
}
