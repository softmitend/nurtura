export default class HomePage {
  async render() { return `<section class="app-state-page"><strong>NURTURA</strong><h1>Menyiapkan ruang kerja...</h1></section>`; }
  async afterRender() {
    const ready = localStorage.getItem("token") && localStorage.getItem("step3_completed") === "true";
    window.location.hash = ready ? "/dashboard" : "/login";
  }
}
