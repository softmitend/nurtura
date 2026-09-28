// src/scripts/pages/dashboard/dashboard-page.js

import "../../../styles/dashboard.css";
import "../../../styles/dashboard-responsive.css";
import getStatistik from "../../data/statistikApi.js";
import getStatusAnak from "../../data/statusAnakApi.js";
import Chart from "chart.js/auto";

let chartInstance = null;
let tahunAktif = "All";

const labelOrder = ["Normal", "Stunted", "Severely Stunted"];

const labelMappingAPI = {
  Normal: ["Normal"],
  Stunted: ["Stunting"],
  "Severely Stunted": ["Berpotensi Stunting"],
};

const DashboardPage = {
  async render() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.hash = "/login";
      return "";
    }

    return `
      <section class="dashboard-page page-shell">
        <div class="dashboard-shell">
          <div class="dashboard-heading">
            <div class="dashboard-heading-copy">
              <p class="eyebrow">Child Growth Monitoring System</p>
              <h1>Pemantauan pertumbuhan</h1>
              <p class="dashboard-subtitle">Lihat kondisi anak secara ringkas, jelas, dan mudah ditindaklanjuti.</p>
            </div>
            <div class="tahun-select-container">
              <label for="tahun-select">Periode</label>
              <select id="tahun-select"></select>
            </div>
          </div>

          <section class="dashboard-hero" aria-label="NURTURA overview">
            <div class="dashboard-hero-copy">
              <span class="hero-label">NURTURA</span>
              <h2>Tumbuh sehat, <em>dipantau dengan sederhana.</em></h2>
              <p>Pantau status gizi dan perkembangan anak tanpa harus membaca terlalu banyak informasi sekaligus.</p>
              <div class="hero-actions">
                <a class="hero-primary" href="#/tambah-anak">Tambah Data Anak</a>
                <a class="hero-secondary" href="#/anak">Lihat Data Anak</a>
              </div>
            </div>
            <div class="dashboard-hero-note">
              <span class="note-dot"></span>
              <small>Ringkas dan terarah</small>
              <strong>3 kategori status gizi</strong>
              <p>Klik kartu status untuk melihat daftar anak pada kategori tersebut.</p>
            </div>
          </section>

          <div class="dashboard-section-heading">
            <div>
              <span>Ringkasan</span>
              <h2>Status gizi anak</h2>
            </div>
            <p>Data mengikuti tanggal pemeriksaan terakhir pada periode yang dipilih.</p>
          </div>

          <div class="summary-boxes">
            ${labelOrder.map((label) => `
              <button type="button" class="summary-box" data-status="${label}">
                <span class="summary-copy">
                  <small>${getLabelDisplay(label)}</small>
                  <strong id="${getSpanId(label)}">...</strong>
                  <span class="summary-caption">anak</span>
                </span>
                <span class="summary-arrow" aria-hidden="true">↗</span>
              </button>`).join("")}
          </div>

          <div class="chart-container">
            <div class="chart-title">
              <div>
                <span class="chart-eyebrow">Distribusi</span>
                <h2>Status gizi berdasarkan periode</h2>
              </div>
              <p>Perbandingan jumlah anak berdasarkan pemeriksaan terbaru pada setiap kategori.</p>
            </div>
            <div class="chart-canvas-wrap"><canvas id="stuntingChart"></canvas></div>
          </div>
        </div>
      </section>

      <div id="anak-modal" class="anak-modal hidden">
        <div class="modal">
          <div class="modal-header"><h2 id="modal-title">Daftar Anak</h2><button class="modal-close" onclick="closeDashboardModal()" aria-label="Tutup">×</button></div>
          <div class="modal-body" id="modal-list"></div>
        </div>
      </div>`;
  },

  async afterRender() {
    const token = localStorage.getItem("token");
    const statistik = await getStatistik(token);
    const anakData = await getStatusAnak(token);

    if (!statistik) {
      console.warn("Data statistik tidak tersedia.");
      return;
    }

    const tahunList = Object.keys(statistik).sort().reverse();
    if (!tahunList.includes("All")) tahunList.unshift("All");

    const tahunSelect = document.getElementById("tahun-select");
    tahunSelect.innerHTML = "";
    tahunList.forEach((tahun) => {
      const option = document.createElement("option");
      option.value = tahun;
      option.textContent = tahun === "All" ? "Semua Tahun" : tahun;
      tahunSelect.appendChild(option);
    });

    tahunAktif = "All";
    updateDashboard(tahunAktif, statistik);

    tahunSelect.addEventListener("change", (event) => {
      tahunAktif = event.target.value;
      updateDashboard(tahunAktif, statistik);
    });

    document.querySelectorAll(".summary-box").forEach((box) => {
      box.addEventListener("click", () => {
        const status = box.getAttribute("data-status");
        const targetLabels = labelMappingAPI[status] || [status];
        const filtered = anakData.filter((anak) => {
          if (!anak.last_checkup_at) return false;
          const tahunPemeriksaan = new Date(anak.last_checkup_at).getFullYear().toString();
          const label = anak.label?.toLowerCase().trim();
          return targetLabels.map((item) => item.toLowerCase().trim()).includes(label) &&
            (tahunAktif === "All" || tahunPemeriksaan === tahunAktif);
        });
        tampilkanModal(filtered, status, tahunAktif);
      });
    });

    document.getElementById("anak-modal").addEventListener("click", (event) => {
      if (event.target.id === "anak-modal") closeDashboardModal();
    });
    window.onkeydown = (event) => { if (event.key === "Escape") closeDashboardModal(); };
    window.closeDashboardModal = closeDashboardModal;
  },
};

function updateDashboard(tahun, statistik) {
  const dataTahun = tahun === "All"
    ? Object.values(statistik).reduce((total, current) => {
        labelOrder.forEach((label) => { total[label] = (total[label] || 0) + (Number(current?.[label]) || 0); });
        return total;
      }, {})
    : statistik[tahun] || {};

  labelOrder.forEach((label) => {
    const span = document.getElementById(getSpanId(label));
    if (span) span.textContent = dataTahun[label] || 0;
  });

  const canvas = document.getElementById("stuntingChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const periodLabel = tahun === "All" ? "Semua Tahun" : `Tahun ${tahun}`;
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labelOrder.map(getLabelDisplay),
      datasets: [{
        label: `Statistik Anak (${periodLabel})`,
        data: labelOrder.map((label) => dataTahun[label] || 0),
        borderWidth: 0,
        borderRadius: 18,
        borderSkipped: false,
        backgroundColor: ["#8fcbb0", "#e7c876", "#d99aa1"],
        maxBarThickness: 76,
      }],
    },
    options: {
      layout: { padding: 0 }, responsive: true, maintainAspectRatio: false,
      plugins: {
        title: { display: false }, legend: { display: false },
        tooltip: { backgroundColor: "#242620", padding: 12, displayColors: false, callbacks: { label: (context) => `${context.raw} anak` } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: "#8a877f", precision: 0 }, grid: { color: "#eee8df" }, border: { display: false } },
        x: { ticks: { color: "#5e5f59", font: { weight: 600 } }, grid: { display: false }, border: { display: false } },
      },
    },
  });
}

function tampilkanModal(data, status, tahunAktif) {
  const modal = document.getElementById("anak-modal");
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-list");
  const sorted = [...data].sort((a, b) => new Date(b.last_checkup_at) - new Date(a.last_checkup_at));

  title.textContent = `Daftar Anak dengan Status: ${getLabelDisplay(status)} (${tahunAktif === "All" ? "Semua Tahun" : `Tahun ${tahunAktif}`})`;
  body.innerHTML = sorted.length === 0
    ? `<p><em>Tidak ada anak dengan status ini di ${tahunAktif === "All" ? "Semua Tahun" : `Tahun ${tahunAktif}`}.</em></p>`
    : sorted.map((anak) => `
        <div class="anak-item-card">
          <div class="anak-item-header"><strong>${anak.nama}</strong></div>
          <div class="anak-item-body">${anak.jenis_kelamin} • Umur: ${anak.umur_bulan} bln<br>TB: ${anak.tinggi_badan} cm • BB: ${anak.berat_badan} kg</div>
          <div class="anak-item-footer">Pemeriksaan terakhir: ${new Date(anak.last_checkup_at).toLocaleDateString("id-ID")}</div>
        </div>`).join("");

  modal.classList.remove("hidden");
  modal.classList.add("open");
}

function closeDashboardModal() {
  const modal = document.getElementById("anak-modal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.classList.add("hidden");
}

function getLabelDisplay(label) {
  switch (label) {
    case "Severely Stunted": return "Berpotensi Stunting";
    case "Stunted": return "Penderita Stunting";
    case "Normal": return "Normal";
    default: return label;
  }
}

function getSpanId(label) {
  switch (label) {
    case "Severely Stunted": return "severely-stunted-count";
    case "Stunted": return "stunted-count";
    case "Normal": return "normal-count";
    default: return "";
  }
}

export default DashboardPage;
