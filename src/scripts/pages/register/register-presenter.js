import { register, login } from "../../data/api.js";

export default class RegisterPresenter {
  constructor({ view }) {
    this.view = view;
  }

  async handleRegister(username, password) {
    try {
      // 1. Register user baru
      const registerResult = await register({ username, password });

      // 2. Login otomatis setelah sukses register
      const loginResult = await login({ username, password });

      const { token, username: userNameFromAPI } = loginResult.loginResult;

      // 3. Simpan data autentikasi dan step1
      localStorage.setItem("token", token);
      localStorage.setItem("username", userNameFromAPI);
      localStorage.setItem("step1_completed", "true");

      // 4. Redirect ke halaman buat profil
      window.location.hash = "/buat-profile";
    } catch (error) {
      const message = error?.message || "Registrasi gagal. Silakan coba lagi.";
      this.view.showError(message);
    }
  }
}
