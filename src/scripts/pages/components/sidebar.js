import "../../../styles/sidebar.css";

const icon = (name) => {
  const paths = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    children: '<circle cx="9" cy="8" r="4"/><path d="M2.5 21a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="3"/><path d="M16 15.5c3.2-.7 5.5 1.2 5.5 4.5"/>',
    profile: '<path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/><circle cx="12" cy="7" r="4"/>',
    report: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h4a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-4"/>',
  };
  return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
};

const Sidebar = {
  render() {
    const active = window.location.hash || "#/dashboard";
    const item = (href, label, iconName) => `<li><a href="${href}" class="${active === href ? "active" : ""}">${icon(iconName)}<span>${label}</span></a></li>`;
    return `
      <div class="overlay" id="overlay"></div>
      <nav class="sidebar" id="sidebar" aria-label="Navigasi utama">
        <a class="sidebar-brand" href="#/dashboard" aria-label="NURTURA Dashboard">
          <img src="/images/nurtura-logo.svg" alt="NURTURA - Child Growth Monitoring System" />
        </a>
        <div class="sidebar-separator"></div>
        <div class="nav-section-label">Menu</div>
        <ul class="nav-links">
          ${item("#/dashboard", "Dashboard", "dashboard")}
          ${item("#/anak", "Data Anak", "children")}
          ${item("#/riwayat", "Riwayat", "history")}
          ${item("#/report", "Laporan", "report")}
          <li class="nav-divider" aria-hidden="true"></li>
          ${item("#/profile-posyandu", "Profil Posyandu", "profile")}
          <li class="nav-spacer"></li>
          <li><a href="#" id="logoutBtn" class="logout-link">${icon("logout")}<span>Keluar</span></a></li>
        </ul>
        <div class="sidebar-footer">
          <span class="status-dot"></span>
          <span><strong>Posyandu Workspace</strong><small>Sistem aktif</small></span>
        </div>
      </nav>`;
  },
  afterRender() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const toggle = document.getElementById("mobile-nav-toggle");
    const close = () => {
      sidebar?.classList.remove("open");
      overlay?.classList.remove("show");
      toggle?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    };
    const open = () => {
      sidebar?.classList.add("open");
      overlay?.classList.add("show");
      toggle?.setAttribute("aria-expanded", "true");
      document.body.classList.add("nav-open");
    };
    document.getElementById("logoutBtn")?.addEventListener("click", (event) => {
      event.preventDefault();
      ["token", "step1_completed", "step2_completed", "step3_completed"].forEach((key) => localStorage.removeItem(key));
      window.location.hash = "/login";
      location.reload();
    });
    sidebar?.querySelectorAll("a:not(#logoutBtn)").forEach((anchor) => anchor.addEventListener("click", close));
    toggle?.addEventListener("click", (event) => {
      event.stopPropagation();
      sidebar?.classList.contains("open") ? close() : open();
    });
    overlay?.addEventListener("click", close);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && sidebar?.classList.contains("open")) close();
    });
  },
};

export default Sidebar;
