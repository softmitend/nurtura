const BASE_URL = '';

export async function getReportHistory(token) {
  const response = await fetch(`${BASE_URL}/api/riwayat-report`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : { message: 'Server mengembalikan respons yang tidak valid.' };

  if (!response.ok) {
    throw new Error(payload.message || 'Gagal mengambil data laporan pemeriksaan');
  }

  return payload.data || [];
}
