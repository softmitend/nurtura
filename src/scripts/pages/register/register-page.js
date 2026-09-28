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
            <div class="auth-form-heading"><span class="auth-kicker">Buat akun</span><h2>Registrasi NURTURA</h2><p>Gunakan username yang mudah diingat dan password minimal 6 karakter.</p></div>
            <form id="registerForm" class="auth-form-card" novalidate>
              <label class="auth-field" for="username"><span>Username</span><input id="username" name="username" type="text" autocomplete="username" placeholder="Contoh: posyandumelati" required /></label>
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
      const username = form.username.value.trim();
      const password = form.password.value.trim();
      const confirmPassword = form.confirmPassword.value.trim();
      this.showError("");
      if (!username || !password || !confirmPassword) { this.showError("Semua field wajib diisi."); return; }
      if (password.length < 6) { this.showError("Password minimal 6 karakter."); return; }
      if (password !== confirmPassword) { this.showError("Password dan konfirmasi password tidak sama."); return; }
      submitBtn.disabled = true; submitBtn.querySelector("span").textContent = "Mendaftarkan...";
      await this.presenter.handleRegister(username, password);
      submitBtn.disabled = false; submitBtn.querySelector("span").textContent = "Buat akun";
    });
  },
  showError(message) { const el = document.getElementById("registerError"); if (!el) return; el.textContent = message; el.classList.toggle("is-error", Boolean(message)); el.classList.remove("is-success"); },
  showSuccess(message) { const el = document.getElementById("registerError"); if (!el) return; el.textContent = message; el.classList.toggle("is-success", Boolean(message)); el.classList.remove("is-error"); },
};

export default RegisterPage;
