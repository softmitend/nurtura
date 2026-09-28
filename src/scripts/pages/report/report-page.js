import '../../../styles/report.css';
import { getReportHistory } from '../../data/reportApi.js';

const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
}[char]));

const statusClass = (value = '') => String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
const dateOnly = (value) => value ? String(value).slice(0, 10) : '';
const parseDate = (value) => {
  const raw = dateOnly(value);
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};
const formatDate = (value) => {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
};
const formatAge = (value) => {
  if (value == null || value === '') return '-';
  const months = Number(value);
  if (!Number.isFinite(months)) return '-';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return years > 0 ? `${years} th${rest ? ` ${rest} bln` : ''}` : `${rest} bln`;
};
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const ReportPage = {
  _data: [],
  _filtered: [],

  async render() {
    if (!localStorage.getItem('token')) {
      window.location.hash = '/login';
      return '';
    }

    return `
      <main class="main-content page-shell report-page">
        <div class="page-heading report-page-heading">
          <div class="page-heading-copy">
            <span class="eyebrow">Riwayat pemeriksaan</span>
            <h1>Laporan Pertumbuhan</h1>
            <p>Cari, filter, dan ekspor riwayat pemeriksaan sesuai anak maupun periode yang dibutuhkan.</p>
          </div>
          <div class="report-export-actions">
            <button id="exportCsv" class="btn-secondary" type="button" disabled>Export CSV</button>
            <button id="exportPdf" class="btn-primary" type="button" disabled>Export PDF</button>
          </div>
        </div>

        <section class="report-filter-panel" aria-label="Filter laporan">
          <div class="report-filter-grid">
            <label class="report-filter-field report-filter-search">
              <span>Cari data</span>
              <div class="report-search-control">
                <span aria-hidden="true">⌕</span>
                <input type="search" id="searchInput" placeholder="Nama, ID, orang tua, alamat, status, catatan..." autocomplete="off" />
                <button id="clearSearch" class="report-search-clear" type="button" hidden aria-label="Hapus pencarian">×</button>
              </div>
            </label>

            <label class="report-filter-field">
              <span>Anak</span>
              <select id="childFilter">
                <option value="">Semua anak</option>
              </select>
            </label>

            <label class="report-filter-field">
              <span>Periode</span>
              <select id="periodFilter">
                <option value="all">Semua waktu</option>
                <option value="1">1 bulan terakhir</option>
                <option value="3">3 bulan terakhir</option>
                <option value="6">6 bulan terakhir</option>
                <option value="12">1 tahun terakhir</option>
                <option value="year">Tahun tertentu</option>
                <option value="range">Rentang tanggal</option>
              </select>
            </label>

            <label class="report-filter-field">
              <span>Status</span>
              <select id="statusFilter">
                <option value="">Semua status</option>
              </select>
            </label>

            <label class="report-filter-field report-conditional" id="yearField" hidden>
              <span>Tahun</span>
              <select id="yearFilter"></select>
            </label>

            <label class="report-filter-field report-conditional" id="startDateField" hidden>
              <span>Dari tanggal</span>
              <input type="date" id="startDate" />
            </label>

            <label class="report-filter-field report-conditional" id="endDateField" hidden>
              <span>Sampai tanggal</span>
              <input type="date" id="endDate" />
            </label>
          </div>

          <div class="report-filter-footer">
            <div id="reportCount" class="report-result-count" aria-live="polite">Memuat data...</div>
            <button id="resetFilters" class="btn-secondary" type="button">Reset Filter</button>
          </div>
        </section>

        <div class="table-container responsive-table-wrap">
          <table class="report-table responsive-data-table">
            <thead>
              <tr>
                <th>Tanggal</th><th>Nama Anak</th><th>ID</th><th>Posyandu</th><th>Umur</th>
                <th>Tinggi</th><th>Berat</th><th>Lingkar Kepala</th><th>Status</th><th>Catatan</th>
              </tr>
            </thead>
            <tbody id="reportBody">
              <tr class="table-state"><td colspan="10"><span class="loading-dot"></span> Memuat laporan...</td></tr>
            </tbody>
          </table>
        </div>
      </main>`;
  },

  async afterRender() {
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('reportBody');
    const count = document.getElementById('reportCount');

    try {
      this._data = await getReportHistory(token);
      this._populateFilterOptions();
      this._bindFilters();
      this._applyFilters();
    } catch (error) {
      count.textContent = 'Gagal memuat data';
      tbody.innerHTML = `<tr class="table-state table-error"><td colspan="10"><strong>Laporan gagal dimuat</strong><span>${escapeHtml(error.message || 'Silakan coba lagi beberapa saat.')}</span></td></tr>`;
    }
  },

  _populateFilterOptions() {
    const childFilter = document.getElementById('childFilter');
    const statusFilter = document.getElementById('statusFilter');
    const yearFilter = document.getElementById('yearFilter');

    const children = new Map();
    this._data.forEach((item) => {
      if (!children.has(String(item.anak_id))) {
        children.set(String(item.anak_id), {
          nama: item.nama || 'Tanpa nama',
          nomor: item.nomor_identitas || '',
        });
      }
    });

    [...children.entries()]
      .sort((a, b) => a[1].nama.localeCompare(b[1].nama, 'id'))
      .forEach(([id, child]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = child.nomor ? `${child.nama} · ${child.nomor}` : child.nama;
        childFilter.appendChild(option);
      });

    [...new Set(this._data.map((item) => item.status).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'id'))
      .forEach((status) => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        statusFilter.appendChild(option);
      });

    const years = [...new Set(this._data
      .map((item) => parseDate(item.tanggal_pemeriksaan)?.getFullYear())
      .filter(Boolean))].sort((a, b) => b - a);
    const fallbackYear = new Date().getFullYear();
    (years.length ? years : [fallbackYear]).forEach((year) => {
      const option = document.createElement('option');
      option.value = String(year);
      option.textContent = String(year);
      yearFilter.appendChild(option);
    });
  },

  _bindFilters() {
    const ids = ['searchInput', 'childFilter', 'periodFilter', 'statusFilter', 'yearFilter', 'startDate', 'endDate'];
    ids.forEach((id) => {
      const element = document.getElementById(id);
      element?.addEventListener(id === 'searchInput' ? 'input' : 'change', () => this._applyFilters());
    });

    document.getElementById('periodFilter')?.addEventListener('change', () => this._syncConditionalFilters());
    document.getElementById('clearSearch')?.addEventListener('click', () => {
      const input = document.getElementById('searchInput');
      input.value = '';
      this._applyFilters();
      input.focus();
    });
    document.getElementById('resetFilters')?.addEventListener('click', () => this._resetFilters());
    document.getElementById('exportCsv')?.addEventListener('click', () => this._exportCsv());
    document.getElementById('exportPdf')?.addEventListener('click', () => this._exportPdf());
  },

  _syncConditionalFilters() {
    const period = document.getElementById('periodFilter').value;
    document.getElementById('yearField').hidden = period !== 'year';
    document.getElementById('startDateField').hidden = period !== 'range';
    document.getElementById('endDateField').hidden = period !== 'range';
  },

  _applyFilters() {
    this._syncConditionalFilters();
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim().toLowerCase();
    const childId = document.getElementById('childFilter').value;
    const status = document.getElementById('statusFilter').value;
    const period = document.getElementById('periodFilter').value;
    const selectedYear = Number(document.getElementById('yearFilter').value);
    const startDate = parseDate(document.getElementById('startDate').value);
    const endDate = parseDate(document.getElementById('endDate').value);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let periodStart = null;
    if (/^\d+$/.test(period)) {
      periodStart = new Date(now.getFullYear(), now.getMonth() - Number(period), now.getDate());
      periodStart.setHours(0, 0, 0, 0);
    }

    this._filtered = this._data.filter((item) => {
      const itemDate = parseDate(item.tanggal_pemeriksaan);
      if (childId && String(item.anak_id) !== childId) return false;
      if (status && item.status !== status) return false;

      if (periodStart && (!itemDate || itemDate < periodStart || itemDate > now)) return false;
      if (period === 'year' && (!itemDate || itemDate.getFullYear() !== selectedYear)) return false;
      if (period === 'range') {
        if (!itemDate) return false;
        if (startDate && itemDate < startDate) return false;
        if (endDate) {
          const inclusiveEnd = new Date(endDate);
          inclusiveEnd.setHours(23, 59, 59, 999);
          if (itemDate > inclusiveEnd) return false;
        }
      }

      if (!query) return true;
      return [
        item.nama, item.nomor_identitas, item.nama_orang_tua, item.alamat, item.posyandu,
        item.status, item.catatan, formatDate(item.tanggal_pemeriksaan), item.jenis_kelamin,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
    });

    document.getElementById('clearSearch').hidden = !query;
    this._renderRows();
  },

  _renderRows() {
    const tbody = document.getElementById('reportBody');
    const count = document.getElementById('reportCount');
    const exportCsv = document.getElementById('exportCsv');
    const exportPdf = document.getElementById('exportPdf');

    count.textContent = `${this._filtered.length} dari ${this._data.length} pemeriksaan`;
    exportCsv.disabled = this._filtered.length === 0;
    exportPdf.disabled = this._filtered.length === 0;

    if (!this._filtered.length) {
      tbody.innerHTML = `<tr class="table-state"><td colspan="10"><strong>Data pemeriksaan tidak ditemukan</strong><span>Ubah pencarian atau filter periode yang digunakan.</span></td></tr>`;
      return;
    }

    tbody.innerHTML = this._filtered.map((item) => `
      <tr>
        <td data-label="Tanggal"><strong>${escapeHtml(formatDate(item.tanggal_pemeriksaan))}</strong></td>
        <td data-label="Nama Anak"><strong>${escapeHtml(item.nama || '-')}</strong></td>
        <td data-label="ID">${escapeHtml(item.nomor_identitas || '-')}</td>
        <td data-label="Posyandu">${escapeHtml(item.posyandu || '-')}</td>
        <td data-label="Umur">${escapeHtml(formatAge(item.umur_bulan))}</td>
        <td data-label="Tinggi">${item.tinggi_badan == null ? '-' : `${escapeHtml(item.tinggi_badan)} cm`}</td>
        <td data-label="Berat">${item.berat_badan == null ? '-' : `${escapeHtml(item.berat_badan)} kg`}</td>
        <td data-label="Lingkar Kepala">${item.lingkar_kepala == null ? '-' : `${escapeHtml(item.lingkar_kepala)} cm`}</td>
        <td data-label="Status"><span class="status-label ${statusClass(item.status)}">${escapeHtml(item.status || '-')}</span></td>
        <td data-label="Catatan">${escapeHtml(item.catatan || '-')}</td>
      </tr>`).join('');
  },

  _resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('childFilter').value = '';
    document.getElementById('periodFilter').value = 'all';
    document.getElementById('statusFilter').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    this._applyFilters();
  },

  _filterSummary() {
    const child = document.getElementById('childFilter');
    const period = document.getElementById('periodFilter');
    const status = document.getElementById('statusFilter');
    const parts = [];
    if (child.value) parts.push(`Anak: ${child.options[child.selectedIndex].text}`);
    if (period.value !== 'all') {
      if (period.value === 'year') parts.push(`Tahun: ${document.getElementById('yearFilter').value}`);
      else if (period.value === 'range') parts.push(`Periode: ${document.getElementById('startDate').value || 'awal'} s.d. ${document.getElementById('endDate').value || 'akhir'}`);
      else parts.push(period.options[period.selectedIndex].text);
    }
    if (status.value) parts.push(`Status: ${status.value}`);
    return parts.length ? parts.join(' | ') : 'Semua data pemeriksaan';
  },

  _exportCsv() {
    if (!this._filtered.length) return;
    const headers = ['Tanggal Pemeriksaan', 'Nama Anak', 'Nomor Identitas', 'Jenis Kelamin', 'Posyandu', 'Umur (bulan)', 'Tinggi (cm)', 'Berat (kg)', 'Lingkar Kepala (cm)', 'Status', 'Orang Tua/Wali', 'Alamat', 'Catatan'];
    const rows = this._filtered.map((item) => [
      dateOnly(item.tanggal_pemeriksaan), item.nama, item.nomor_identitas, item.jenis_kelamin,
      item.posyandu, item.umur_bulan, item.tinggi_badan, item.berat_badan, item.lingkar_kepala,
      item.status, item.nama_orang_tua, item.alamat, item.catatan,
    ]);
    const content = '\uFEFF' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nurtura-laporan-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  _exportPdf() {
    if (!this._filtered.length) return;
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) {
      alert('Browser memblokir jendela export. Izinkan pop-up untuk menyimpan laporan sebagai PDF.');
      return;
    }

    const rows = this._filtered.map((item) => `
      <tr>
        <td>${escapeHtml(formatDate(item.tanggal_pemeriksaan))}</td>
        <td>${escapeHtml(item.nama || '-')}</td>
        <td>${escapeHtml(item.nomor_identitas || '-')}</td>
        <td>${escapeHtml(formatAge(item.umur_bulan))}</td>
        <td>${item.tinggi_badan ?? '-'} cm</td>
        <td>${item.berat_badan ?? '-'} kg</td>
        <td>${escapeHtml(item.status || '-')}</td>
        <td>${escapeHtml(item.catatan || '-')}</td>
      </tr>`).join('');

    popup.document.write(`<!doctype html><html><head><title>Laporan NURTURA</title><style>
      @page{size:A4 landscape;margin:14mm}body{font-family:Arial,sans-serif;color:#222;font-size:10px}h1{font-size:20px;margin:0 0 5px}p{margin:0 0 14px;color:#666}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}th{background:#f2f2f2;font-size:9px}footer{margin-top:10px;color:#777;font-size:9px}@media print{button{display:none}}
    </style></head><body><h1>Laporan Pemeriksaan NURTURA</h1><p>${escapeHtml(this._filterSummary())} · ${this._filtered.length} pemeriksaan</p><table><thead><tr><th>Tanggal</th><th>Nama</th><th>ID</th><th>Umur</th><th>Tinggi</th><th>Berat</th><th>Status</th><th>Catatan</th></tr></thead><tbody>${rows}</tbody></table><footer>Dicetak ${escapeHtml(new Date().toLocaleString('id-ID'))}</footer><script>window.onload=()=>{window.print();};<\/script></body></html>`);
    popup.document.close();
  },
};

export default ReportPage;
