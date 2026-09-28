import "../../../styles/header.css";

const pageMeta = () => {
  const path = window.location.hash.replace("#", "") || "/dashboard";
  const pages = {
    "/dashboard": ["Dashboard", "Ringkasan pemantauan pertumbuhan"],
    "/anak": ["Data Anak", "Kelola data dan status pertumbuhan"],
    "/tambah-anak": ["Tambah Anak", "Catat pengukuran baru"],
    "/detail-anak": ["Detail Anak", "Informasi pertumbuhan terakhir"],
    "/profile-posyandu": ["Profil Posyandu", "Identitas fasilitas layanan"],
    "/report": ["Laporan", "Rekap pemantauan anak"],
    "/riwayat": ["Riwayat", "Pemeriksaan anak"],
  };
  return pages[path] || ["NURTURA", "Child Growth Monitoring System"];
};

const Header = {
  render() {
    const [title, subtitle] = pageMeta();
    return `
      <div class="app-header-inner">
        <div class="header-left">
          <button id="mobile-nav-toggle" class="mobile-nav-toggle" type="button" aria-label="Buka navigasi" aria-controls="sidebar" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <button class="header-mobile-brand" type="button" aria-label="Ke dashboard">
            <img src="/images/nurtura-mark.svg" alt="" />
            <span>NURTURA</span>
          </button>
          <div class="header-page-context" aria-live="polite">
            <strong>${title}</strong>
            <small>${subtitle}</small>
          </div>
        </div>
        <div class="header-right">
          <span class="header-status"><i></i> Sistem aktif</span>
          <span class="header-product">Child Growth Monitoring System</span>
        </div>
      </div>`;
  },
  afterRender() {
    document.querySelector(".header-mobile-brand")?.addEventListener("click", () => {
      window.location.hash = "/dashboard";
    });
  },
};

export default Header;
