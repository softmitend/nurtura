import StepIndicator from "../components/StepIndicator.js";
import "../../../styles/auth.css";

const WelcomePage = {
  render() {
    return `
      <section class="auth-page auth-welcome-page">
        <aside class="auth-brand-panel">
          <a class="auth-brand" href="#/welcome"><img src="/images/nurtura-logo.svg" alt="NURTURA - Child Growth Monitoring System" /></a>
          <div class="auth-brand-message"><span class="auth-kicker">Langkah 3 dari 3</span><h1>Ruang kerja Anda <em>siap.</em></h1><p>Mulai dari data yang sederhana, lalu jadikan setiap pemeriksaan lebih mudah dibaca dan ditindaklanjuti.</p></div>
          <div class="auth-brand-points" aria-hidden="true"><span>Profil selesai</span><span>Dashboard siap</span><span>Mulai memantau</span></div>
          <div class="auth-orbit auth-orbit-one"></div><div class="auth-orbit auth-orbit-two"></div>
        </aside>
        <main class="auth-form-panel">
          <div class="auth-form-wrap">
            ${StepIndicator.render(3)}
            <div class="welcome-card">
              <span class="welcome-mark"><img src="/images/nurtura-mark.svg" alt="" /></span>
              <span class="auth-kicker">Selesai</span>
              <h2>Selamat datang di NURTURA</h2>
              <p>Registrasi dan profil Posyandu sudah lengkap. Anda sekarang dapat mulai mencatat dan memantau pertumbuhan anak.</p>
              <button id="lanjutBtn" class="auth-submit" type="button"><span>Buka dashboard</span><b aria-hidden="true">→</b></button>
            </div>
          </div>
        </main>
      </section>`;
  },
  async afterRender() {
    document.getElementById("lanjutBtn")?.addEventListener("click", () => {
      localStorage.setItem("step3_completed", "true");
      window.location.hash = "/dashboard";
    });
  },
};

export default WelcomePage;
