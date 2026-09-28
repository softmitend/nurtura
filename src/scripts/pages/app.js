import routes from "../routes/routes.js";
import { getActivePathname } from "../routes/url-parser.js";
import Sidebar from "./components/sidebar.js";
import Header from "./components/header.js";
import { protectRoute } from "../utils/auth-guard.js";

class App {
  #content = null;
  constructor({ content }) { this.#content = content; }

  async renderPage() {
    const path = getActivePathname();
    const redirectPath = protectRoute(path);
    if (redirectPath) { window.location.hash = redirectPath; return; }
    const page = routes[path] || routes["/"];
    if (!page || typeof page.render !== "function") {
      this.#content.innerHTML = `<section class="app-state-page"><strong>404</strong><h1>Halaman tidak ditemukan</h1><a href="#/dashboard">Kembali ke dashboard</a></section>`;
      return;
    }
    try {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
    } catch (error) {
      this.#content.innerHTML = `<section class="app-state-page"><strong>Terjadi kesalahan</strong><h1>Halaman gagal dimuat</h1><p>Silakan muat ulang halaman atau kembali ke dashboard.</p><a href="#/dashboard">Kembali ke dashboard</a></section>`;
      console.error("Render error:", error);
    }
    this._updateNavigationUI();
  }

  _updateNavigationUI() {
    const currentRoute = window.location.hash.replace("#", "") || "/";
    const publicRoutes = ["/login", "/register", "/welcome", "/buat-profile"];
    const isPublic = publicRoutes.includes(currentRoute);
    const step3Completed = localStorage.getItem("step3_completed") === "true";
    const useAppShell = !isPublic && step3Completed;
    document.body.classList.toggle("public-view", !useAppShell);
    document.body.classList.toggle("app-view", useAppShell);

    const mainHeader = document.getElementById("main-header");
    const sidebarContainer = document.getElementById("sidebar-container");
    if (mainHeader) {
      if (!useAppShell) { mainHeader.innerHTML = ""; mainHeader.style.display = "none"; }
      else { mainHeader.innerHTML = Header.render(); Header.afterRender(); mainHeader.style.display = "flex"; }
    }
    if (sidebarContainer) {
      if (!useAppShell) sidebarContainer.innerHTML = "";
      else { sidebarContainer.innerHTML = Sidebar.render(); Sidebar.afterRender(); }
    }
  }

  handleLogout() {
    ["token", "step1_completed", "step2_completed", "step3_completed"].forEach((key) => localStorage.removeItem(key));
    window.location.hash = "/login";
    location.reload();
  }
}

export default App;
