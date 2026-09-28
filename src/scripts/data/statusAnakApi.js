const BASE_URL = '';

async function getStatusAnak(token) {
  try {
    const response = await fetch(`${BASE_URL}/api/status-anak`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Gagal ambil data');
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Gagal ambil data status anak:', error.message);
    return null;
  }
}

export default getStatusAnak;
