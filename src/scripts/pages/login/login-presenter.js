import { login } from "../../data/api.js";

export default class LoginPresenter {
  constructor({ view }) {
    this.view = view;
  }

  async handleLogin(username, password) {
    try {
      this.view.showLoading();

      const data = await login({ username, password });

      // ✅ Simpan token
      localStorage.setItem("token", data.loginResult.token);

      // ✅ Tandai bahwa user sudah menyelesaikan semua langkah
      // Kalau ingin lebih dinamis, bisa request profil dulu dan cek status step
      localStorage.setItem("step1_completed", "true");
      localStorage.setItem("step2_completed", "true");
      localStorage.setItem("step3_completed", "true");

      // ✅ Arahkan ke dashboard
      window.location.hash = "/dashboard";
    } catch (error) {
      this.view.showError(error.message || "Login gagal. Silakan coba lagi.");
    } finally {
      this.view.hideLoading();
    }
  }
}
