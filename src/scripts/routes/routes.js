import LoginPage from "../pages/login/login-page";
import RegisterPage from "../pages/register/register-page";
import HomePage from "../pages/home/home-page";
import DashboardPage from "../pages/dashboard/dashboard-page.js";
import AnakPage from "../pages/anak/anak-page.js";
import TambahAnakPage from "../pages/add-anak/tambah-anak-page.js";
import DetailAnakPage from "../pages/detail/detail-anak-page.js";
import ReportPage from "../pages/report/report-page.js"; // ✅ Tambahkan ini
import RiwayatPage from "../pages/riwayat-pemeriksaan-anak/RiwayatPage.js";
import ProfilePosyanduPage from "../pages/profile-posyandu/profile-posyandu-page.js";
import WelcomePage from "../pages/welcome/welcome-page.js";
import CreateProfilePosyanduPage from "../pages/profile-posyandu/create-profile-posyandu-page.js";

const routes = {
  "/login": LoginPage,
  "/register": RegisterPage,
  "/dashboard": DashboardPage, // ⬅️ Tambahan ini
  "/report": ReportPage, // ✅ Tambahkan ini
  "/": HomePage,
  "/anak": AnakPage, // ✅ Tambahkan ini
  "/tambah-anak": TambahAnakPage, // ✅ Tambahkan ini
  "/detail-anak": DetailAnakPage,
  "/riwayat": RiwayatPage, // ✅ Tambahkan ini
  "/profile-posyandu": ProfilePosyanduPage,
  "/welcome": WelcomePage,
  "/buat-profile": CreateProfilePosyanduPage, // ✅ Tambahkan ini
};

export default routes;
