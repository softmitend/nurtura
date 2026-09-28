import { tambahAnak } from "../../data/anakApi.js";
import "../../../styles/anak.css";

const TambahAnakPage = {
  async render() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.hash = "/login";
      return "";
    }

    return `
      <main class="main-content-anak page-shell">
        <div class="form-container identity-form-container">
          <div class="form-heading">
            <div>
              <span class="eyebrow">Identitas anak</span>
              <h2>Tambah Data Anak</h2>
              <p>Simpan data identitas terlebih dahulu. Pengukuran tinggi dan berat ditambahkan lewat pemeriksaan di halaman detail anak.</p>
            </div>
            <span class="required-note">* Wajib diisi</span>
          </div>

          <form id="formTambahAnak" class="form-anak identity-form">
            <section class="form-section form-section-photo">
              <div class="section-copy">
                <h3>Foto anak</h3>
                <p>Opsional. Gunakan JPG atau PNG maksimal 2 MB.</p>
              </div>
              <div class="photo-upload-row">
                <label class="photo-dropzone" for="fotoFile">
                  <span class="photo-upload-icon" aria-hidden="true">＋</span>
                  <span><strong>Pilih foto anak</strong><small>Foto dapat ditambahkan atau diganti nanti.</small></span>
                </label>
                <input class="sr-only-file" type="file" id="fotoFile" name="fotoFile" accept="image/png,image/jpeg,image/webp" />
                <div class="preview-container">
                  <span id="previewPlaceholder" class="preview-placeholder">Belum ada foto</span>
                  <img id="previewFoto" class="preview-foto" alt="Preview foto anak" />
                </div>
              </div>
              <div id="uploadStatus" class="field-status" aria-live="polite"></div>
              <input type="hidden" id="fotoUrl" name="fotoUrl" value="" />
            </section>

            <section class="form-section">
              <div class="section-copy">
                <h3>Data anak</h3>
                <p>Informasi dasar yang tidak berubah pada setiap pemeriksaan.</p>
              </div>
              <div class="form-grid">
                <div class="form-group form-group-wide">
                  <label for="nama">Nama lengkap anak *</label>
                  <input type="text" id="nama" name="nama" placeholder="Contoh: Alya Putri Ramadhani" minlength="2" maxlength="120" required />
                </div>
                <div class="form-group">
                  <label for="nomor_identitas">Nomor identitas anak *</label>
                  <input type="text" id="nomor_identitas" name="nomor_identitas" placeholder="NIK / nomor akta / ID anak" maxlength="80" required />
                </div>
                <div class="form-group">
                  <label for="jenis_kelamin">Jenis kelamin *</label>
                  <select id="jenis_kelamin" name="jenis_kelamin" required>
                    <option value="">Pilih jenis kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="tanggal_lahir">Tanggal lahir *</label>
                  <input type="date" id="tanggal_lahir" name="tanggal_lahir" required />
                </div>
              </div>
            </section>

            <section class="form-section">
              <div class="section-copy">
                <h3>Orang tua / wali</h3>
                <p>Kontak utama untuk kebutuhan tindak lanjut Posyandu.</p>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label for="nama_orang_tua">Nama orang tua / wali *</label>
                  <input type="text" id="nama_orang_tua" name="nama_orang_tua" placeholder="Nama lengkap orang tua / wali" maxlength="120" required />
                </div>
                <div class="form-group">
                  <label for="no_telepon_orang_tua">Nomor telepon *</label>
                  <input type="tel" id="no_telepon_orang_tua" name="no_telepon_orang_tua" placeholder="Contoh: 081234567890" maxlength="30" required />
                </div>
                <div class="form-group form-group-wide">
                  <label for="alamat">Alamat lengkap *</label>
                  <textarea id="alamat" name="alamat" placeholder="Jalan, RT/RW, desa/kelurahan, kecamatan" maxlength="500" required></textarea>
                </div>
              </div>
            </section>

            <div id="formMessage" class="form-message form-message-wide" aria-live="polite"></div>
            <div class="button-container">
              <button type="button" id="cancelTambah" class="btn-secondary">Batal</button>
              <button type="submit" class="btn-tambah-data" id="submitTambah"><span class="submit-label">Simpan Data Anak</span></button>
            </div>
          </form>
        </div>
      </main>`;
  },

  async afterRender() {
    const form = document.getElementById("formTambahAnak");
    const token = localStorage.getItem("token");
    const fotoInput = document.getElementById("fotoFile");
    const previewImg = document.getElementById("previewFoto");
    const hiddenFotoUrl = document.getElementById("fotoUrl");
    const uploadStatus = document.getElementById("uploadStatus");
    const previewPlaceholder = document.getElementById("previewPlaceholder");
    const submitButton = document.getElementById("submitTambah");
    const formMessage = document.getElementById("formMessage");
    const birthDate = document.getElementById("tanggal_lahir");

    birthDate.max = new Date().toISOString().slice(0, 10);
    document.getElementById("cancelTambah").addEventListener("click", () => { window.location.hash = "/anak"; });

    fotoInput.addEventListener("change", async () => {
      const file = fotoInput.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
        uploadStatus.textContent = "Gunakan gambar maksimal 2 MB.";
        uploadStatus.className = "field-status is-error";
        fotoInput.value = "";
        return;
      }

      const localPreview = URL.createObjectURL(file);
      previewImg.src = localPreview;
      previewPlaceholder.hidden = true;
      uploadStatus.textContent = "Mengunggah foto...";
      uploadStatus.className = "field-status is-loading";
      submitButton.disabled = true;

      const cloudForm = new FormData();
      cloudForm.append("file", file);
      cloudForm.append("upload_preset", "stunting_anak");

      try {
        const uploadRes = await fetch("https://api.cloudinary.com/v1_1/dydfth7zs/image/upload", { method: "POST", body: cloudForm });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.secure_url) throw new Error("Upload gagal");
        hiddenFotoUrl.value = uploadData.secure_url;
        uploadStatus.textContent = "Foto siap digunakan.";
        uploadStatus.className = "field-status is-success";
      } catch (_) {
        hiddenFotoUrl.value = "";
        uploadStatus.textContent = "Foto gagal diunggah. Data anak tetap dapat disimpan tanpa foto.";
        uploadStatus.className = "field-status is-error";
      } finally {
        URL.revokeObjectURL(localPreview);
        submitButton.disabled = false;
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      formMessage.textContent = "";
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const formData = new FormData(form);
      const payload = {
        nama: formData.get("nama")?.trim(),
        nomor_identitas: formData.get("nomor_identitas")?.trim(),
        jenis_kelamin: formData.get("jenis_kelamin"),
        tanggal_lahir: formData.get("tanggal_lahir"),
        nama_orang_tua: formData.get("nama_orang_tua")?.trim(),
        no_telepon_orang_tua: formData.get("no_telepon_orang_tua")?.trim(),
        alamat: formData.get("alamat")?.trim(),
        foto_url: formData.get("fotoUrl") || null,
      };

      submitButton.disabled = true;
      submitButton.querySelector(".submit-label").textContent = "Menyimpan...";
      try {
        const child = await tambahAnak(token, payload);
        formMessage.textContent = "Data anak berhasil disimpan. Pemeriksaan pertama dapat ditambahkan dari halaman detail anak.";
        formMessage.className = "form-message is-success form-message-wide";
        if (child?.id) localStorage.setItem("anak_id", child.id);
        setTimeout(() => { window.location.hash = child?.id ? "/detail-anak" : "/anak"; }, 500);
      } catch (error) {
        formMessage.textContent = error.message || "Gagal menyimpan data anak.";
        formMessage.className = "form-message is-error form-message-wide";
        submitButton.disabled = false;
        submitButton.querySelector(".submit-label").textContent = "Simpan Data Anak";
      }
    });
  },
};

export default TambahAnakPage;
