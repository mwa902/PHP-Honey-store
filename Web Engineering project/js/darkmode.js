/**
 * Dark Mode – Honey Sugar Bakery
 * Persists preference in localStorage.
 * Adds/removes class "dark-mode" on <body>.
 * Call initDarkMode() once the DOM is ready.
 */
(function () {
  var STORAGE_KEY = "hsb_dark_mode";

  function applyTheme(dark) {
    if (dark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    // Update every toggle button on the page
    document.querySelectorAll(".dm-toggle-btn").forEach(function (btn) {
      btn.textContent = dark ? "☀️" : "🌙";
      btn.setAttribute("title", dark ? "Switch to Light Mode" : "Switch to Dark Mode");
      btn.setAttribute("aria-label", dark ? "Switch to Light Mode" : "Switch to Dark Mode");
    });
  }

  function isDark() {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }

  function toggle() {
    var next = !isDark();
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    applyTheme(next);
  }

  window.initDarkMode = function () {
    // Apply saved preference immediately (before paint)
    applyTheme(isDark());

    // Wire up all buttons that already exist
    document.querySelectorAll(".dm-toggle-btn").forEach(function (btn) {
      btn.addEventListener("click", toggle);
    });
  };

  // Auto-init when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.initDarkMode);
  } else {
    window.initDarkMode();
  }
})();
