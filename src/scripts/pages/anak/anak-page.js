import AnakPresenter from "./anak-presenter";
import "../../../styles/daftar-anak.css";

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[char]));

const normalizeStatus = (label = "") => String(label || "").toLowerCase().trim().replace(/\s+/g, "-");

const AnakPage = {
  async render() {
    return `
      <main class="main-content anak-page-main">
        <div class="anak-page-shell">
          <header class="anak-page-heading">
            <div>
              <p class="eyebrow">Data identitas & pemeriksaan</p>
              <h1>Data Anak</h1>
              <p class="page-subtitle">Kelola identitas anak dan buka detail untuk menambahkan pemeriksaan berkala.</p>
            </div>
            <a href="#/tambah-anak" class="btn-tambah"><span aria-hidden="true">+</span> Tambah Anak</a>
          </header>

          <section class="anak-toolbar" aria-label="Pencarian data anak">
            <label class="anak-search">
              <span class="search-icon" aria-hidden="true">⌕</span>
              <input type="search" id="searchInput" placeholder="Cari nama atau nomor identitas..." autocomplete="off" />
            </label>
            <div class="anak-result-meta" id="resultMeta" aria-live="polite">Memuat data...</div>
          </section>

          <div id="anakList" class="anak-list" aria-live="polite">
            ${Array.from({length: 4}, () => `<div class="anak-card skeleton-card"><div class="skeleton-avatar"></div><div class="skeleton-lines"><i></i><i></i><i></i></div></div>`).join("")}
          </div>
        </div>
      </main>`;
  },

  async afterRender() {
    const token = localStorage.getItem("token");
    const container = document.getElementById("anakList");
    const searchInput = document.getElementById("searchInput");
    const resultMeta = document.getElementById("resultMeta");
    let anakList = [];

    const renderList = (data, keyword = "") => {
      resultMeta.textContent = `${data.length} anak${keyword ? ` ditemukan untuk “${keyword}”` : " terdaftar"}`;
      if (!data.length) {
        container.innerHTML = `<div class="anak-empty"><div class="empty-icon" aria-hidden="true">⌕</div><h2>${keyword ? "Data tidak ditemukan" : "Belum ada data anak"}</h2><p>${keyword ? "Coba gunakan nama atau nomor identitas yang berbeda." : "Tambahkan identitas anak pertama. Pemeriksaan dapat dicatat setelah data anak tersimpan."}</p>${keyword ? "" : '<a href="#/tambah-anak" class="btn-tambah">+ Tambah Anak</a>'}</div>`;
        return;
      }

      container.innerHTML = data.map((anak) => {
        const safeName = escapeHtml(anak.nama);
        const safeGender = escapeHtml(anak.jenis_kelamin || "-");
        const safeLabel = escapeHtml(anak.label || "Belum diperiksa");
        const hasCheckup = Boolean(anak.last_checkup_at || (anak.tinggi_badan != null && anak.berat_badan != null));
        const lastDateValue = anak.last_checkup_at || (hasCheckup ? anak.created_at : null);
        const date = lastDateValue ? new Date(lastDateValue).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "Belum ada pemeriksaan";
        const identity = anak.nomor_identitas ? `ID · ${escapeHtml(anak.nomor_identitas)}` : safeGender;
        return `<article class="anak-card" data-id="${escapeHtml(anak.id)}" tabindex="0" role="link" aria-label="Lihat detail ${safeName}">
          <div class="anak-card-top">
            ${anak.foto_url ? `<img src="${escapeHtml(anak.foto_url)}" alt="Foto ${safeName}" class="foto-anak" loading="lazy" />` : `<div class="placeholder-foto" aria-hidden="true"><span>${safeName.charAt(0).toUpperCase()}</span></div>`}
            <div class="anak-identity"><h2>${safeName}</h2><p>${identity} · ${safeGender}</p></div>
            <span class="status ${normalizeStatus(anak.label)}">${safeLabel}</span>
          </div>
          <div class="anak-card-bottom"><span><small>Pemeriksaan terakhir</small><strong>${date}</strong></span><span class="detail-link">Buka detail <b>→</b></span></div>
        </article>`;
      }).join("");

      container.querySelectorAll(".anak-card[data-id]").forEach((card) => {
        const openDetail = () => { localStorage.setItem("anak_id", card.dataset.id); window.location.hash = "/detail-anak"; };
        card.addEventListener("click", openDetail);
        card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDetail(); } });
      });
    };

    try {
      anakList = await AnakPresenter.fetchAnakList(token);
      renderList(anakList);
      searchInput.addEventListener("input", () => {
        const keyword = searchInput.value.trim().toLowerCase();
        const filtered = anakList.filter((anak) => [anak.nama, anak.nomor_identitas, anak.nama_orang_tua]
          .filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword)));
        renderList(filtered, searchInput.value.trim());
      });
    } catch (error) {
      resultMeta.textContent = "Gagal memuat data";
      container.innerHTML = `<div class="anak-empty error-state"><div class="empty-icon" aria-hidden="true">!</div><h2>Data gagal dimuat</h2><p>${escapeHtml(error.message || "Terjadi kesalahan saat mengambil data.")}</p><button type="button" class="btn-tambah" id="retryAnak">Coba lagi</button></div>`;
      document.getElementById("retryAnak")?.addEventListener("click", () => window.location.reload());
    }
  },
};
export default AnakPage;
