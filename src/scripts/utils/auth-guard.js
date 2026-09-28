// utils/auth-guard.js

export function isAuthenticated() {
  return !!localStorage.getItem("token");
}

export function getStepStatus() {
  return {
    step1: localStorage.getItem("step1_completed") === "true",
    step2: localStorage.getItem("step2_completed") === "true",
    step3: localStorage.getItem("step3_completed") === "true",
  };
}

/**
 * Mengecek apakah route saat ini boleh diakses.
 * @param {string} currentRoute - Hash path saat ini, misal "/dashboard"
 * @returns {string|null} - Jika perlu redirect, kembalikan path tujuan. Jika aman, return null.
 */
export function protectRoute(currentRoute) {
  const publicRoutes = ["/login", "/register", "/buat-profile", "/welcome"];
  const token = localStorage.getItem("token");
  const steps = getStepStatus();

  // 🔒 Belum login & akses route privat
  if (!token && !publicRoutes.includes(currentRoute)) {
    return "/login";
  }

  // 🧭 Skenario step-by-step
  if (token && !steps.step1 && currentRoute !== "/register") {
    return "/register";
  }

  if (
    token &&
    steps.step1 &&
    !steps.step2 &&
    currentRoute !== "/buat-profile"
  ) {
    return "/buat-profile";
  }

  if (
    token &&
    steps.step1 &&
    steps.step2 &&
    !steps.step3 &&
    currentRoute !== "/welcome"
  ) {
    return "/welcome";
  }

  // ✅ Aman
  return null;
}
