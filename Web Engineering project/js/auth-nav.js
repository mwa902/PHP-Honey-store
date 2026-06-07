(function () {
  function checkAuth() {
    var btn = document.getElementById("authNavBtn");
    if (!btn) return;

    // Hide until we know the real state — prevents flash of wrong label
    btn.style.visibility = "hidden";

    fetch("../php/session_info.php", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.ok && data.logged_in) {
          btn.textContent = "Logout";
          btn.href = "../php/logout.php";
        } else {
          btn.textContent = "Login";
          btn.href = "../login.php";
        }
        btn.style.visibility = "visible";
      })
      .catch(function () {
        btn.textContent = "Login";
        btn.href = "../login.php";
        btn.style.visibility = "visible";
      });
  }

  // Run on initial load
  checkAuth();

  // Re-run when user navigates back (bfcache restore)
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      checkAuth();
    }
  });
})();
