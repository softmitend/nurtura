import LoginPresenter from "./login-presenter.js";
import "../../../styles/auth.css";

const eyeIcon = `<svg class="eye-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.7"/></svg>`;

const LoginPage = {
  render() {
    return `
      <section class="auth-page auth-login-page">
        <aside class="auth-brand-panel">
          <a class="auth-brand" href="#/login"><img src="/images/nurtura-logo.svg" alt="NURTURA - Child Growth Monitoring System" /></a>
          <div class="auth-brand-message">
            <span class="auth-kicker">Tumbuh bersama, dipantau dengan baik</span>
            <h1>Pemantauan anak yang <em>lebih sederhana.</em></h1>
            <p>NURTURA membantu kader Posyandu menyimpan, membaca, dan menindaklanjuti data pertumbuhan anak dalam satu ruang kerja yang rapi.</p>
          </div>
          <div class="auth-brand-points" aria-hidden="true"><span>Data terstruktur</span><span>Status lebih jelas</span><span>Ringkasan cepat</span></div>
          <div class="auth-orbit auth-orbit-one"></div><div class="auth-orbit auth-orbit-two"></div>
        </aside>

        <main class="auth-form-panel">
          <div class="auth-form-wrap">
            <div class="auth-form-heading"><span class="auth-kicker">Selamat datang kembali</span><h2>Masuk ke NURTURA</h2><p>Gunakan akun kader Posyandu untuk melanjutkan.</p></div>
            <form id="loginForm" class="auth-form-card" novalidate>
              <label class="auth-field" for="username"><span>Username</span><input id="username" name="username" type="text" autocomplete="username" placeholder="Masukkan username" required /></label>
              <label class="auth-field" for="password"><span>Password</span><div class="password-wrapper"><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Masukkan password" required /><button class="toggle-password" type="button" aria-label="Tampilkan password">${eyeIcon}</button></div></label>
              <p id="loginError" class="auth-message" role="alert" aria-live="polite"></p>
              <button type="submit" class="auth-submit"><span>Masuk</span><b aria-hidden="true">→</b></button>
              <div id="loginLoading" class="spinner" hidden></div>
              <p class="auth-switch">Belum punya akun? <a href="#/register">Buat akun</a></p>
            </form>
          </div>
        </main>
      </section>`;
  },

  async afterRender() {
    this.presenter = new LoginPresenter({ view: this });
    const form = document.getElementById("loginForm");
    const password = document.getElementById("password");
    document.querySelector(".toggle-password")?.addEventListener("click", (event) => {
      const show = password.type === "password";
      password.type = show ? "text" : "password";
      event.currentTarget.setAttribute("aria-label", show ? "Sembunyikan password" : "Tampilkan password");
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = form.username.value.trim();
      const passwordValue = form.password.value.trim();
      this.showError("");
      if (!username || !passwordValue) { this.showError("Username dan password wajib diisi."); return; }
      await this.presenter.handleLogin(username, passwordValue);
    });
  },

  showError(message) { const el = document.getElementById("loginError"); if (el) el.textContent = message; },
  showLoading() { const el = document.getElementById("loginLoading"); if (el) el.hidden = false; this.disableForm(); },
  hideLoading() { const el = document.getElementById("loginLoading"); if (el) el.hidden = true; this.enableForm(); },
  disableForm() { document.getElementById("loginForm")?.querySelectorAll("input, button").forEach((el) => el.disabled = true); },
  enableForm() { document.getElementById("loginForm")?.querySelectorAll("input, button").forEach((el) => el.disabled = false); },
};

export default LoginPage;
