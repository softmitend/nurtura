import { register, login } from "../../data/api.js";

export default class RegisterPresenter {
  constructor({ view }) {
    this.view = view;
  }

  async handleRegister({ namaPosyandu, username, password }) {
    try {
      // 1. Buat akun menggunakan username sebagai kredensial login.
      await register({ username, password });

      // 2. Login otomatis setelah registrasi berhasil.
      const loginResult = await login({ username, password });
      const { token, username: userNameFromAPI } = loginResult.loginResult;

      // 3. Simpan autentikasi dan nama Posyandu sementara untuk langkah profil.
      localStorage.setItem("token", token);
      localStorage.setItem("username", userNameFromAPI);
      localStorage.setItem("pending_posyandu_name", namaPosyandu);
      localStorage.setItem("step1_completed", "true");

      // 4. Lanjutkan ke pengisian profil Posyandu.
      window.location.hash = "/buat-profile";
    } catch (error) {
      const message = error?.message || "Registrasi gagal. Silakan coba lagi.";
      this.view.showError(message);
    }
  }
}
