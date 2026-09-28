import DetailAnakPresenter from "./detail-anak-presenter.js";
import "../../../styles/detail-anak.css";

const esc = (value = "") => String(value ?? "").replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[char]));
const statusClass = (value = "") => String(value || "").toLowerCase().trim().replace(/\s+/g, "-");
const dateValue = (value) => value ? String(value).slice(0, 10) : "";
const formatDate = (value) => {
  if (!value) return "-";
  const raw = new Date(`${dateValue(value)}T00:00:00`);
  return Number.isNaN(raw.getTime()) ? "-" : raw.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

const DetailAnakPage = {
  async render() {
    if (!localStorage.getItem("token")) {
      window.location.hash = "/login";
      return "";
    }
    return `<section class="detail-page"><div id="detailContainer" class="detail-anak"><div class="detail-loading"><span class="detail-skeleton avatar"></span><div><span class="detail-skeleton line wide"></span><span class="detail-skeleton line"></span><span class="detail-skeleton line"></span></div></div></div></section>`;
  },

  async afterRender() {
    const token = localStorage.getItem("token");
    const anakId = localStorage.getItem("anak_id");
    const container = document.getElementById("detailContainer");

    if (!anakId) {
      container.innerHTML = `<div class="detail-state"><strong>Data anak belum dipilih</strong><p>Pilih anak melalui menu Data Anak di sidebar untuk melihat detailnya.</p></div>`;
      return;
    }

    try {
      const [child, history] = await Promise.all([
        DetailAnakPresenter.fetchDetailAnak(token, anakId),
        DetailAnakPresenter.fetchRiwayat(token, anakId),
      ]);
      const latest = history[0] || null;
      this._renderDetail(container, child, history, latest);
      this._bindActions({ token, anakId, child });
    } catch (error) {
      container.innerHTML = `<div class="detail-state error-state"><strong>Data gagal dimuat</strong><p>${esc(error.message || "Terjadi kesalahan saat mengambil data anak.")}</p><div><button class="btn-warning" id="retryButton">Coba lagi</button></div></div>`;
      document.getElementById("retryButton")?.addEventListener("click", () => this.afterRender());
    }
  },

  _renderDetail(container, child, history, latest) {
    const currentStatus = latest?.status || child.label || "Belum diperiksa";
    const initial = esc(child.nama || "?").charAt(0).toUpperCase();
    const historyRows = history.length ? history.map((item) => `
      <tr>
        <td data-label="Tanggal"><strong>${esc(formatDate(item.tanggal_pemeriksaan))}</strong></td>
        <td data-label="Umur">${esc(item.umur_bulan)} bulan</td>
        <td data-label="Tinggi">${esc(item.tinggi_badan)} cm</td>
        <td data-label="Berat">${esc(item.berat_badan)} kg</td>
        <td data-label="Lingkar kepala">${item.lingkar_kepala == null ? "-" : `${esc(item.lingkar_kepala)} cm`}</td>
        <td data-label="Status"><span class="status ${statusClass(item.status)}">${esc(item.status)}</span></td>
        <td data-label="Catatan">${esc(item.catatan || "-")}</td>
      </tr>`).join("") : `
      <tr class="history-empty-row"><td colspan="7"><strong>Belum ada pemeriksaan</strong><span>Tambahkan pemeriksaan pertama untuk mulai membangun riwayat pertumbuhan anak.</span></td></tr>`;

    container.innerHTML = `
      <div class="detail-topbar">
        <div>
          <span class="eyebrow">Profil anak</span>
          <h1>${esc(child.nama)}</h1>
          <p>Identitas tetap terpisah dari data pemeriksaan berkala.</p>
        </div>
        <div class="detail-top-actions">
          <span class="status ${statusClass(currentStatus)}">${esc(currentStatus)}</span>
          <button id="editIdentityButton" class="btn-secondary" type="button">Edit Identitas</button>
          <button id="addCheckupButton" class="btn-primary" type="button">+ Tambah Pemeriksaan</button>
        </div>
      </div>

      <section class="identity-card">
        <aside class="child-profile">
          <div class="foto-container">${child.foto_url ? `<img src="${esc(child.foto_url)}" alt="Foto ${esc(child.nama)}" class="foto-anak-detail" />` : `<div class="placeholder-foto-detail" aria-label="Foto tidak tersedia"><span>${initial}</span></div>`}</div>
          <strong>${esc(child.nama)}</strong>
          <small>${child.nomor_identitas ? `ID · ${esc(child.nomor_identitas)}` : `ID internal · ${esc(child.id)}`}</small>
        </aside>
        <div class="identity-grid">
          <div class="identity-item"><span>Nomor identitas</span><strong>${esc(child.nomor_identitas || "-")}</strong></div>
          <div class="identity-item"><span>Jenis kelamin</span><strong>${esc(child.jenis_kelamin || "-")}</strong></div>
          <div class="identity-item"><span>Tanggal lahir</span><strong>${esc(formatDate(child.tanggal_lahir))}</strong></div>
          <div class="identity-item"><span>Orang tua / wali</span><strong>${esc(child.nama_orang_tua || "-")}</strong></div>
          <div class="identity-item"><span>Nomor telepon</span><strong>${esc(child.no_telepon_orang_tua || "-")}</strong></div>
          <div class="identity-item identity-item-wide"><span>Alamat</span><strong>${esc(child.alamat || "-")}</strong></div>
        </div>
      </section>

      <section class="latest-section">
        <div class="section-heading-row"><div><span class="eyebrow">Pemeriksaan terbaru</span><h2>Pengukuran terakhir</h2></div><small>${latest ? formatDate(latest.tanggal_pemeriksaan) : "Belum ada data"}</small></div>
        ${latest ? `<div class="latest-grid">
          <div class="metric-card"><span>Umur saat diperiksa</span><strong>${esc(latest.umur_bulan)} <small>bulan</small></strong></div>
          <div class="metric-card"><span>Tinggi badan</span><strong>${esc(latest.tinggi_badan)} <small>cm</small></strong></div>
          <div class="metric-card"><span>Berat badan</span><strong>${esc(latest.berat_badan)} <small>kg</small></strong></div>
          <div class="metric-card"><span>Lingkar kepala</span><strong>${latest.lingkar_kepala == null ? "-" : esc(latest.lingkar_kepala)} <small>${latest.lingkar_kepala == null ? "" : "cm"}</small></strong></div>
        </div>` : `<div class="checkup-empty"><div><strong>Belum ada pemeriksaan untuk ${esc(child.nama)}.</strong><p>Identitas anak sudah tersimpan. Tambahkan tinggi dan berat badan saat pemeriksaan pertama dilakukan.</p></div><button id="addCheckupEmptyButton" class="btn-primary" type="button">+ Tambah pemeriksaan pertama</button></div>`}
      </section>

      <section class="history-section">
        <div class="section-heading-row"><div><span class="eyebrow">Riwayat anak</span><h2>Riwayat pemeriksaan</h2></div><small>${history.length} pemeriksaan tersimpan</small></div>
        <div class="history-table-wrap">
          <table class="history-table">
            <thead><tr><th>Tanggal</th><th>Umur</th><th>Tinggi</th><th>Berat</th><th>Lingkar kepala</th><th>Status</th><th>Catatan</th></tr></thead>
            <tbody>${historyRows}</tbody>
          </table>
        </div>
      </section>

      ${this._identityDialog(child)}
      ${this._checkupDialog(child)}`;
  },

  _identityDialog(child) {
    return `<dialog id="identityDialog" class="editor-dialog">
      <form id="identityForm" class="dialog-form">
        <div class="dialog-heading"><div><span class="eyebrow">Data tetap</span><h2>Edit Identitas Anak</h2><p>Perubahan di sini tidak mengubah riwayat pemeriksaan.</p></div><button type="button" class="dialog-x" id="closeIdentityDialog" aria-label="Tutup">×</button></div>
        <div class="dialog-grid">
          <label class="dialog-field dialog-wide"><span>Nama lengkap *</span><input name="nama" value="${esc(child.nama || "")}" required /></label>
          <label class="dialog-field"><span>Nomor identitas *</span><input name="nomor_identitas" value="${esc(child.nomor_identitas || "")}" required /></label>
          <label class="dialog-field"><span>Jenis kelamin *</span><select name="jenis_kelamin" required><option value="Laki-laki" ${child.jenis_kelamin === "Laki-laki" ? "selected" : ""}>Laki-laki</option><option value="Perempuan" ${child.jenis_kelamin === "Perempuan" ? "selected" : ""}>Perempuan</option></select></label>
          <label class="dialog-field"><span>Tanggal lahir *</span><input type="date" name="tanggal_lahir" value="${esc(dateValue(child.tanggal_lahir))}" required /></label>
          <label class="dialog-field"><span>Nama orang tua / wali *</span><input name="nama_orang_tua" value="${esc(child.nama_orang_tua || "")}" required /></label>
          <label class="dialog-field"><span>Nomor telepon *</span><input type="tel" name="no_telepon_orang_tua" value="${esc(child.no_telepon_orang_tua || "")}" required /></label>
          <label class="dialog-field dialog-wide"><span>Alamat lengkap *</span><textarea name="alamat" required>${esc(child.alamat || "")}</textarea></label>
        </div>
        <p id="identityMessage" class="dialog-message" aria-live="polite"></p>
        <div class="dialog-actions"><button type="button" class="btn-secondary" id="cancelIdentity">Batal</button><button type="submit" class="btn-primary save-action" id="saveIdentity"><span>Simpan Perubahan</span></button></div>
      </form>
    </dialog>`;
  },

  _checkupDialog(child) {
    return `<dialog id="checkupDialog" class="editor-dialog">
      <form id="checkupForm" class="dialog-form">
        <div class="dialog-heading"><div><span class="eyebrow">Riwayat baru</span><h2>Tambah Pemeriksaan</h2><p>Pengukuran sebelumnya tidak akan dihapus atau ditimpa.</p></div><button type="button" class="dialog-x" id="closeCheckupDialog" aria-label="Tutup">×</button></div>
        <div class="checkup-child-chip"><strong>${esc(child.nama)}</strong><span>${child.nomor_identitas ? esc(child.nomor_identitas) : `ID ${esc(child.id)}`}</span></div>
        <div class="dialog-grid">
          <label class="dialog-field dialog-wide"><span>Tanggal pemeriksaan *</span><input type="date" id="tanggalPemeriksaan" name="tanggal_pemeriksaan" required /></label>
          <label class="dialog-field"><span>Tinggi badan (cm) *</span><input type="number" step="0.1" min="30" max="220" name="tinggi_badan" placeholder="Contoh: 86.5" required /></label>
          <label class="dialog-field"><span>Berat badan (kg) *</span><input type="number" step="0.1" min="1" max="200" name="berat_badan" placeholder="Contoh: 12.4" required /></label>
          <label class="dialog-field"><span>Lingkar kepala (cm)</span><input type="number" step="0.1" min="20" max="80" name="lingkar_kepala" placeholder="Opsional" /></label>
          <label class="dialog-field dialog-wide"><span>Catatan pemeriksaan</span><textarea name="catatan" placeholder="Contoh: nafsu makan baik, kontrol kembali bulan depan"></textarea></label>
        </div>
        <p class="checkup-note">Umur saat pemeriksaan dihitung otomatis dari tanggal lahir. Status pertumbuhan dihitung oleh model NURTURA setelah data disimpan.</p>
        <p id="checkupMessage" class="dialog-message" aria-live="polite"></p>
        <div class="dialog-actions"><button type="button" class="btn-secondary" id="cancelCheckup">Batal</button><button type="submit" class="btn-primary save-action" id="saveCheckup"><span>Simpan Pemeriksaan</span></button></div>
      </form>
    </dialog>`;
  },

  _bindActions({ token, anakId, child }) {
    const openDialog = (id) => document.getElementById(id)?.showModal();
    const closeDialog = (id) => document.getElementById(id)?.close();
    const setFormLoading = (form, button, isLoading, loadingText, idleText) => {
      if (!form || !button) return;
      form.classList.toggle("is-saving", isLoading);
      form.setAttribute("aria-busy", String(isLoading));
      form.querySelectorAll("input, select, textarea, button").forEach((control) => {
        control.disabled = isLoading;
      });
      button.innerHTML = isLoading
        ? `<span class="button-spinner" aria-hidden="true"></span><span>${loadingText}</span>`
        : `<span>${idleText}</span>`;
    };

    const today = new Date().toISOString().slice(0, 10);
    const checkupDate = document.getElementById("tanggalPemeriksaan");
    if (checkupDate) {
      checkupDate.value = today;
      checkupDate.max = today;
      if (child.tanggal_lahir) checkupDate.min = dateValue(child.tanggal_lahir);
    }
    const identityBirth = document.querySelector('#identityForm input[name="tanggal_lahir"]');
    if (identityBirth) identityBirth.max = today;

    document.getElementById("editIdentityButton")?.addEventListener("click", () => openDialog("identityDialog"));
    document.getElementById("addCheckupButton")?.addEventListener("click", () => openDialog("checkupDialog"));
    document.getElementById("addCheckupEmptyButton")?.addEventListener("click", () => openDialog("checkupDialog"));
    document.getElementById("closeIdentityDialog")?.addEventListener("click", () => closeDialog("identityDialog"));
    document.getElementById("cancelIdentity")?.addEventListener("click", () => closeDialog("identityDialog"));
    document.getElementById("closeCheckupDialog")?.addEventListener("click", () => closeDialog("checkupDialog"));
    document.getElementById("cancelCheckup")?.addEventListener("click", () => closeDialog("checkupDialog"));

    document.getElementById("identityForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = document.getElementById("saveIdentity");
      const message = document.getElementById("identityMessage");
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = new FormData(form);
      message.textContent = "";
      setFormLoading(form, button, true, "Menyimpan...", "Simpan Perubahan");
      try {
        await DetailAnakPresenter.updateIdentitas(token, anakId, {
          nama: data.get("nama")?.trim(),
          nomor_identitas: data.get("nomor_identitas")?.trim(),
          jenis_kelamin: data.get("jenis_kelamin"),
          tanggal_lahir: data.get("tanggal_lahir"),
          nama_orang_tua: data.get("nama_orang_tua")?.trim(),
          no_telepon_orang_tua: data.get("no_telepon_orang_tua")?.trim(),
          alamat: data.get("alamat")?.trim(),
          posyandu: child.posyandu || null,
          foto_url: child.foto_url || null,
        });
        closeDialog("identityDialog");
        await this.afterRender();
      } catch (error) {
        message.textContent = error.message || "Identitas gagal diperbarui.";
        setFormLoading(form, button, false, "Menyimpan...", "Simpan Perubahan");
      }
    });

    document.getElementById("checkupForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = document.getElementById("saveCheckup");
      const message = document.getElementById("checkupMessage");
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = new FormData(form);
      message.textContent = "";
      setFormLoading(form, button, true, "Menyimpan pemeriksaan...", "Simpan Pemeriksaan");
      try {
        await DetailAnakPresenter.tambahPemeriksaan(token, {
          anak_id: Number(anakId),
          tanggal_pemeriksaan: data.get("tanggal_pemeriksaan"),
          tinggi_badan: Number(data.get("tinggi_badan")),
          berat_badan: Number(data.get("berat_badan")),
          lingkar_kepala: data.get("lingkar_kepala") ? Number(data.get("lingkar_kepala")) : null,
          catatan: data.get("catatan")?.trim() || null,
        });
        closeDialog("checkupDialog");
        await this.afterRender();
      } catch (error) {
        message.textContent = error.message || "Pemeriksaan gagal disimpan.";
        setFormLoading(form, button, false, "Menyimpan pemeriksaan...", "Simpan Pemeriksaan");
      }
    });
  },
};

export default DetailAnakPage;
