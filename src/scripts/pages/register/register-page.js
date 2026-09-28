import RegisterPresenter from "./register-presenter.js";
import StepIndicator from "../components/StepIndicator.js";
import "../../../styles/auth.css";

const eyeIcon = `<svg class="eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>`;

const RegisterPage = {
  render() {
    return `
      <section class="auth-page">
        <aside class="auth-brand-panel">
          <a class="auth-brand" href="#/register"><img src="/images/nurtura-logo.svg" alt="NURTURA - Child Growth Monitoring System" /></a>
          <div class="auth-brand-message"><span class="auth-kicker">Langkah 1 dari 3</span><h1>Mulai ruang kerja <em>Posyandu.</em></h1><p>Buat akun, lengkapi profil Posyandu, lalu NURTURA siap digunakan untuk pemantauan pertumbuhan anak.</p></div>
          <div class="auth-brand-points" aria-hidden="true"><span>Akun kader</span><span>Profil fasilitas</span><span>Mulai memantau</span></div>
          <div class="auth-orbit auth-orbit-one"></div><div class="auth-orbit auth-orbit-two"></div>
        </aside>
        <main class="auth-form-panel">
          <div class="auth-form-wrap">
            ${StepIndicator.render(1)}
            <div class="auth-form-heading"><span class="auth-kicker">Buat akun</span><h2>Registrasi NURTURA</h2><p>Nama Posyandu digunakan sebagai identitas fasilitas. Username digunakan khusus untuk masuk ke akun.</p></div>
            <form id="registerForm" class="auth-form-card" novalidate>
              <label class="auth-field" for="namaPosyandu"><span>Nama Posyandu</span><input id="namaPosyandu" name="namaPosyandu" type="text" autocomplete="organization" maxlength="100" placeholder="Contoh: Posyandu Melati" required /></label>
              <label class="auth-field" for="username"><span>Username</span><input id="username" name="username" type="text" autocomplete="username" maxlength="100" placeholder="Contoh: posyandumelati" required /><small>Username ini yang digunakan saat login.</small></label>
              <label class="auth-field" for="password"><span>Password</span><div class="password-wrapper"><input id="password" name="password" type="password" autocomplete="new-password" placeholder="Minimal 6 karakter" required /><button class="toggle-password" type="button" data-target="password" aria-label="Tampilkan password">${eyeIcon}</button></div></label>
              <label class="auth-field" for="confirmPassword"><span>Konfirmasi password</span><div class="password-wrapper"><input id="confirmPassword" name="confirmPassword" type="password" autocomplete="new-password" placeholder="Ulangi password" required /><button class="toggle-password" type="button" data-target="confirmPassword" aria-label="Tampilkan password">${eyeIcon}</button></div></label>
              <p id="registerError" class="auth-message" role="alert" aria-live="polite"></p>
              <button type="submit" id="submitBtn" class="auth-submit"><span>Buat akun</span><b aria-hidden="true">→</b></button>
              <p class="auth-switch">Sudah punya akun? <a href="#/login">Masuk</a></p>
            </form>
          </div>
        </main>
      </section>`;
  },

  async afterRender() {
    const token = localStorage.getItem("token");
    const step1 = localStorage.getItem("step1_completed");
    if (token && step1 === "true") { window.location.hash = "/buat-profile"; return; }
    this.presenter = new RegisterPresenter({ view: this });
    document.querySelectorAll(".toggle-password").forEach((button) => button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password");
    }));
    const form = document.getElementById("registerForm");
    const submitBtn = document.getElementById("submitBtn");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const namaPosyandu = form.namaPosyandu.value.trim();
      const username = form.username.value.trim();
      const password = form.password.value.trim();
      const confirmPassword = form.confirmPassword.value.trim();
      this.showError("");
      if (!namaPosyandu || !username || !password || !confirmPassword) { this.showError("Semua field wajib diisi."); return; }
      if (!/^[a-zA-Z0-9._-]{3,100}$/.test(username)) { this.showError("Username minimal 3 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda minus."); return; }
      if (password.length < 6) { this.showError("Password minimal 6 karakter."); return; }
      if (password !== confirmPassword) { this.showError("Password dan konfirmasi password tidak sama."); return; }
      submitBtn.disabled = true; submitBtn.querySelector("span").textContent = "Mendaftarkan...";
      await this.presenter.handleRegister({ namaPosyandu, username, password });
      submitBtn.disabled = false; submitBtn.querySelector("span").textContent = "Buat akun";
    });
  },
  showError(message) { const el = document.getElementById("registerError"); if (!el) return; el.textContent = message; el.classList.toggle("is-error", Boolean(message)); el.classList.remove("is-success"); },
  showSuccess(message) { const el = document.getElementById("registerError"); if (!el) return; el.textContent = message; el.classList.toggle("is-success", Boolean(message)); el.classList.remove("is-error"); },
};

export default RegisterPage;
