const getRiwayatAnak = async (anakId, token) => {
  const response = await fetch(`/api/riwayat/${anakId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server mengembalikan respons riwayat yang tidak valid (${response.status}).`);
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Gagal mengambil data riwayat');
  }
  return data.data || [];
};

export default getRiwayatAnak;
