import '../../../styles/report.css';
import getStatusAnak from '../../data/statusAnakApi.js';

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
const statusClass = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, '-');

const formatAge = (value) => {
  if (value == null || value === '') return '-';
  const umur = Number(value);
  if (!Number.isFinite(umur)) return '-';
  const tahun = Math.floor(umur / 12);
  const bulan = umur % 12;
  return tahun > 0 ? `${tahun} tahun${bulan ? ` ${bulan} bulan` : ''}` : `${bulan} bulan`;
};

const ReportPage = {
  async render() {
    if (!localStorage.getItem('token')) { window.location.hash = '/login'; return ''; }
    return `<main class="main-content page-shell"><div class="page-heading"><div class="page-heading-copy"><span class="eyebrow">Ringkasan data</span><h1>Laporan Pertumbuhan</h1><p>Lihat pemeriksaan terbaru setiap anak. Anak yang belum diperiksa tetap tercatat tanpa nilai pengukuran palsu.</p></div><div class="page-count" id="reportCount" aria-live="polite">Memuat data...</div></div><div class="search-container report-search" role="search"><span class="search-icon" aria-hidden="true">⌕</span><input type="search" id="searchInput" aria-label="Cari data anak" placeholder="Cari nama, identitas, Posyandu, alamat, atau status..." autocomplete="off" /><button id="clearSearch" class="clear-search" type="button" aria-label="Hapus pencarian" hidden>Hapus</button></div><div class="table-container responsive-table-wrap"><table class="report-table responsive-data-table"><thead><tr><th>No</th><th>Nama</th><th>Alamat</th><th>Posyandu</th><th>Umur</th><th>Tinggi</th><th>Berat</th><th>Status</th></tr></thead><tbody id="reportBody"><tr class="table-state"><td colspan="8"><span class="loading-dot"></span> Memuat laporan...</td></tr></tbody></table></div></main>`;
  },
  async afterRender() {
    const token = localStorage.getItem('token'), tbody = document.getElementById('reportBody'), count = document.getElementById('reportCount'), searchInput = document.getElementById('searchInput'), clearSearch = document.getElementById('clearSearch');
    const renderRows = (items, total) => {
      count.textContent = `${items.length} dari ${total} anak`;
      if (!items.length) { tbody.innerHTML = `<tr class="table-state"><td colspan="8"><strong>Data tidak ditemukan</strong><span>Coba gunakan kata kunci yang berbeda.</span></td></tr>`; return; }
      tbody.innerHTML = items.map((anak, index) => {
        const label = anak.label || 'Belum diperiksa';
        const tinggi = anak.tinggi_badan == null ? '-' : `${anak.tinggi_badan} cm`;
        const berat = anak.berat_badan == null ? '-' : `${anak.berat_badan} kg`;
        return `<tr><td data-label="No">${index + 1}</td><td data-label="Nama"><strong>${escapeHtml(anak.nama || '-')}</strong></td><td data-label="Alamat">${escapeHtml(anak.alamat ?? '-')}</td><td data-label="Posyandu">${escapeHtml(anak.posyandu ?? '-')}</td><td data-label="Umur">${escapeHtml(formatAge(anak.umur_bulan))}</td><td data-label="Tinggi">${escapeHtml(tinggi)}</td><td data-label="Berat">${escapeHtml(berat)}</td><td data-label="Status"><span class="status-label ${statusClass(label)}">${escapeHtml(label)}</span></td></tr>`;
      }).join('');
    };
    try {
      const data = await getStatusAnak(token) || [];
      renderRows(data, data.length);
      const filterData = () => {
        const q = searchInput.value.trim().toLowerCase();
        clearSearch.hidden = !q;
        const filtered = data.filter((anak) => [anak.nama, anak.nomor_identitas, anak.nama_orang_tua, anak.alamat, anak.posyandu, anak.label]
          .filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
        renderRows(filtered, data.length);
      };
      searchInput.addEventListener('input', filterData);
      clearSearch.addEventListener('click', () => { searchInput.value = ''; filterData(); searchInput.focus(); });
    } catch (error) {
      count.textContent = 'Gagal memuat data';
      tbody.innerHTML = `<tr class="table-state table-error"><td colspan="8"><strong>Laporan gagal dimuat</strong><span>${escapeHtml(error.message || 'Silakan coba lagi beberapa saat.')}</span></td></tr>`;
    }
  }
};

export default ReportPage;
