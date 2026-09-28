import StepIndicator from "../components/StepIndicator.js";
import { createProfile } from "../../data/profileApi.js";
import "../../../styles/auth.css";

const CreateProfilePage = {
  render() {
    return `
      <section class="auth-page">
        <aside class="auth-brand-panel">
          <a class="auth-brand" href="#/buat-profile"><img src="/images/nurtura-logo.svg" alt="NURTURA - Child Growth Monitoring System" /></a>
          <div class="auth-brand-message"><span class="auth-kicker">Langkah 2 dari 3</span><h1>Kenalkan <em>Posyandu</em> Anda.</h1><p>Profil ini menjadi identitas ruang kerja dan membantu setiap data anak tersusun dalam konteks fasilitas yang tepat.</p></div>
          <div class="auth-brand-points" aria-hidden="true"><span>Identitas jelas</span><span>Foto fasilitas</span><span>Siap digunakan</span></div>
          <div class="auth-orbit auth-orbit-one"></div><div class="auth-orbit auth-orbit-two"></div>
        </aside>
        <main class="auth-form-panel auth-form-panel-scroll">
          <div class="auth-form-wrap auth-form-wrap-wide">
            ${StepIndicator.render(2)}
            <div class="auth-form-heading"><span class="auth-kicker">Profil fasilitas</span><h2>Buat Profil Posyandu</h2><p>Lengkapi informasi utama. Semuanya masih bisa diperbarui nanti.</p></div>
            <form id="profileForm" class="auth-form-card profile-onboarding-form" novalidate>
              <div class="onboarding-photo-row">
                <div class="onboarding-photo-preview" id="photoPreviewWrap">
                  <div class="onboarding-photo-placeholder" id="photoPlaceholder" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1Z"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 20"/></svg>
                    <span>Belum ada foto</span>
                  </div>
                  <img id="profilePreview" alt="Preview foto Posyandu" class="onboarding-photo" hidden />
                </div>
                <div class="onboarding-photo-actions">
                  <label for="profilePicture" class="upload-button">Pilih foto Posyandu</label>
                  <input type="file" id="profilePicture" accept="image/png,image/jpeg,image/webp" hidden>
                  <p id="uploadStatus" class="field-status">JPG, PNG, atau WebP · maks. 2 MB</p>
                </div>
              </div>
              <label class="auth-field" for="posyanduName"><span>Nama Posyandu</span><input id="posyanduName" name="posyanduName" type="text" placeholder="Contoh: Posyandu Melati" required /></label>
              <div class="auth-field-grid"><label class="auth-field" for="alamat"><span>Alamat</span><input id="alamat" name="alamat" type="text" placeholder="Jl. Kesehatan No. 1" required /></label><label class="auth-field" for="desa"><span>Desa / Kelurahan</span><input id="desa" name="desa" type="text" placeholder="Contoh: Sukamaju" required /></label></div>
              <label class="auth-field" for="deskripsi"><span>Deskripsi singkat</span><textarea id="deskripsi" name="deskripsi" placeholder="Jelaskan layanan atau jadwal Posyandu secara singkat" required></textarea></label>
              <p id="profileError" class="auth-message" role="alert" aria-live="polite"></p>
              <button type="submit" id="submitProfileButton" class="auth-submit"><span>Simpan dan lanjutkan</span><b aria-hidden="true">→</b></button>
              <div id="loadingSpinner" class="spinner" hidden></div>
            </form>
          </div>
        </main>
      </section>`;
  },

  async afterRender() {
    const token = localStorage.getItem("token");
    const step2Completed = localStorage.getItem("step2_completed");
    if (!token) { window.location.hash = "/login"; return; }
    if (step2Completed === "true") { window.location.hash = "/welcome"; return; }

    const form = document.getElementById("profileForm");
    const profilePictureInput = document.getElementById("profilePicture");
    const profilePreview = document.getElementById("profilePreview");
    const photoPlaceholder = document.getElementById("photoPlaceholder");
    const uploadStatus = document.getElementById("uploadStatus");
    const submitProfileButton = document.getElementById("submitProfileButton");
    const loadingSpinner = document.getElementById("loadingSpinner");
    const profileError = document.getElementById("profileError");
    let currentProfileImageUrl = "";

    const resetPreview = () => {
      profilePreview.removeAttribute("src");
      profilePreview.hidden = true;
      photoPlaceholder.hidden = false;
    };

    profilePictureInput.addEventListener("change", async () => {
      const file = profilePictureInput.files?.[0];
      if (!file) { resetPreview(); return; }

      if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
        profilePictureInput.value = "";
        currentProfileImageUrl = "";
        resetPreview();
        uploadStatus.textContent = "Gunakan file gambar maksimal 2 MB.";
        uploadStatus.className = "field-status is-error";
        return;
      }

      const localPreviewUrl = URL.createObjectURL(file);
      profilePreview.src = localPreviewUrl;
      profilePreview.hidden = false;
      photoPlaceholder.hidden = true;
      uploadStatus.textContent = "Mengunggah foto...";
      uploadStatus.className = "field-status is-loading";
      submitProfileButton.disabled = true;

      try {
        currentProfileImageUrl = await this._uploadPhotoToCloudinary(file);
        uploadStatus.textContent = "Foto berhasil diunggah.";
        uploadStatus.className = "field-status is-success";
      } catch (error) {
        currentProfileImageUrl = "";
        resetPreview();
        uploadStatus.textContent = `Foto gagal diunggah: ${error.message}`;
        uploadStatus.className = "field-status is-error";
      } finally {
        URL.revokeObjectURL(localPreviewUrl);
        submitProfileButton.disabled = false;
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      profileError.textContent = "";
      if (!form.checkValidity()) { form.reportValidity(); return; }
      submitProfileButton.disabled = true;
      submitProfileButton.querySelector("span").textContent = "Menyimpan...";
      loadingSpinner.hidden = false;
      try {
        await createProfile(token, {
          nama_posyandu: form.posyanduName.value.trim(),
          alamat: `${form.alamat.value.trim()}, ${form.desa.value.trim()}`,
          foto_url: currentProfileImageUrl || null,
          deskripsi: form.deskripsi.value.trim(),
        });
        localStorage.setItem("step2_completed", "true");
        window.location.hash = "/welcome";
      } catch (error) {
        profileError.textContent = `Terjadi kesalahan: ${error.message}`;
        submitProfileButton.disabled = false;
        submitProfileButton.querySelector("span").textContent = "Simpan dan lanjutkan";
        loadingSpinner.hidden = true;
      }
    });
  },

  async _uploadPhotoToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "stunting_anak");
    const response = await fetch("https://api.cloudinary.com/v1_1/dydfth7zs/image/upload", { method: "POST", body: formData });
    const result = await response.json();
    if (!response.ok || !result.secure_url) throw new Error(result.error?.message || "Upload gagal");
    return result.secure_url;
  },
};

export default CreateProfilePage;
