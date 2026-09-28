import "../styles/styles.css";
import "../styles/modern-ui.css";
import "../styles/sidebar.css";
import "../styles/nurtura-theme.css";
import "../styles/detail-history-button.css";

import App from "./pages/app.js";

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({ content: document.querySelector("#main-content") });

  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });

});
