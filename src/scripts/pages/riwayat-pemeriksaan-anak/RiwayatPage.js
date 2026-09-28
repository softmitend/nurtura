import '../../../styles/report.css';
import getRiwayatAnak from '../../data/riwayat-api.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
}[char]));
const statusClass = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, '-');

const RiwayatPage = {
  async render() {
    if (!localStorage.getItem('token')) { window.location.hash = '/login'; return ''; }
    return `
      <main class="main-content page-shell">
        <div class="page-heading">
          <div class="page-heading-copy"><h1>Riwayat Pemeriksaan</h1><p>Jejak pengukuran tinggi, berat, umur, dan status pertumbuhan anak.</p></div>
          <div class="page-count" id="historyCount" aria-live="polite">Memuat data...</div>
        </div>
        <div class="table-container responsive-table-wrap">
          <table class="report-table responsive-data-table">
            <thead><tr><th>No</th><th>Tanggal</th><th>Umur</th><th>Tinggi</th><th>Berat</th><th>Status</th></tr></thead>
            <tbody id="reportBody"><tr class="table-state"><td colspan="6"><span class="loading-dot"></span> Memuat riwayat...</td></tr></tbody>
          </table>
        </div>
      </main>`;
  },

  async afterRender() {
    const tbody = document.getElementById('reportBody');
    const count = document.getElementById('historyCount');
    const anakId = localStorage.getItem('anak_id');
    if (!anakId) {
      count.textContent = 'Belum ada anak dipilih';
      tbody.innerHTML = `<tr class="table-state"><td colspan="6"><strong>Pilih anak terlebih dahulu</strong><span>Buka Data Anak lalu pilih salah satu anak untuk melihat riwayat pemeriksaannya.</span></td></tr>`;
      return;
    }
    try {
      const data = await getRiwayatAnak(anakId, localStorage.getItem('token')) || [];
      count.textContent = `${data.length} pemeriksaan`;
      if (!data.length) {
        tbody.innerHTML = `<tr class="table-state"><td colspan="6"><strong>Belum ada riwayat</strong><span>Data pemeriksaan anak akan muncul di sini.</span></td></tr>`;
        return;
      }
      tbody.innerHTML = data.map((riwayat, index) => {
        const umur = Number(riwayat.umur_bulan) || 0;
        const tahun = Math.floor(umur / 12); const bulan = umur % 12;
        const umurString = tahun > 0 ? `${tahun} tahun${bulan ? ` ${bulan} bulan` : ''}` : `${bulan} bulan`;
        const rawDate = new Date(riwayat.tanggal_pemeriksaan);
        const tanggal = Number.isNaN(rawDate.getTime()) ? '-' : rawDate.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
        const status = riwayat.status || '-';
        return `<tr>
          <td data-label="No">${index + 1}</td><td data-label="Tanggal"><strong>${escapeHtml(tanggal)}</strong></td>
          <td data-label="Umur">${escapeHtml(umurString)}</td><td data-label="Tinggi">${escapeHtml(riwayat.tinggi_badan ?? '-')} cm</td>
          <td data-label="Berat">${escapeHtml(riwayat.berat_badan ?? '-')} kg</td><td data-label="Status"><span class="status-label ${statusClass(status)}">${escapeHtml(status)}</span></td>
        </tr>`;
      }).join('');
    } catch (error) {
      count.textContent = 'Gagal memuat data';
      tbody.innerHTML = `<tr class="table-state table-error"><td colspan="6"><strong>Riwayat gagal dimuat</strong><span>${escapeHtml(error.message || 'Silakan coba lagi.')}</span></td></tr>`;
    }
  }
};
export default RiwayatPage;
