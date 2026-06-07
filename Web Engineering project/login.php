<?php
require_once __DIR__ . '/php/config.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
start_secure_session();
$redirect = htmlspecialchars(trim((string)($_GET['redirect'] ?? '')));
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <title>Login – Honey Sugar Bakery</title>
  <link rel="stylesheet" href="login.css">
  <link rel="stylesheet" href="js/darkmode.css">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="login-page-body">

  <button class="dm-toggle-btn" id="dmToggle" title="Switch to Dark Mode"
    aria-label="Switch to Dark Mode"
    style="position:fixed;top:18px;right:18px;z-index:9999;">🌙</button>
  <div class="auth-left">

    <div class="hex-bg">
      <div class="hex"></div><div class="hex"></div><div class="hex"></div>
      <div class="hex"></div><div class="hex"></div><div class="hex"></div>
      <div class="hex"></div><div class="hex"></div>
    </div>

    <div class="auth-left-inner">

      <div class="auth-brand">
        <img src="home/bee.png" alt="Logo" class="auth-brand-logo"
             onerror="this.style.display='none'">
        <div class="auth-brand-name">
          Honey Sugar
          <span>Bakery</span>
        </div>
      </div>

      <span class="auth-hero-emoji">🍯</span>
      <h2>Welcome <span>Back!</span></h2>
      <p>Log in to explore our pure, handcrafted honey collection — straight from the hive to your home.</p>

      <div class="auth-features">
        <div class="auth-feature-item">
          <span class="feat-icon">🌿</span>
          <div class="feat-text">
            <strong>100% Natural Honey</strong>
            <span>No additives, no preservatives — pure goodness</span>
          </div>
        </div>
        <div class="auth-feature-item">
          <span class="feat-icon">🚚</span>
          <div class="feat-text">
            <strong>Free Delivery</strong>
            <span>On all orders above Rs. 1,500</span>
          </div>
        </div>
        <div class="auth-feature-item">
          <span class="feat-icon">🎁</span>
          <div class="feat-text">
            <strong>Exclusive Member Offers</strong>
            <span>Special discounts for registered customers</span>
          </div>
        </div>
        <div class="auth-feature-item">
          <span class="feat-icon">🧪</span>
          <div class="feat-text">
            <strong>Lab Tested Quality</strong>
            <span>Every batch certified for purity &amp; safety</span>
          </div>
        </div>
      </div>

      <p class="auth-tagline">
        <strong>"Pure from the hive, straight to your heart."</strong>
      </p>

    </div>
  </div>

  <div class="auth-right">
    <div class="auth-form-wrap">

      <h2>Login  🍯</h2>
      <p class="auth-subtitle">Welcome back! Enter your credentials below.</p>

      <?php if (!empty($_SESSION['signup_success'])): ?>
        <div class="auth-alert success">
          ✅ <?= htmlspecialchars($_SESSION['signup_success']); unset($_SESSION['signup_success']); ?>
        </div>
      <?php endif; ?>

      <?php if (!empty($_SESSION['login_error'])): ?>
        <div class="auth-alert error">
          ❌ <?= htmlspecialchars($_SESSION['login_error']); unset($_SESSION['login_error']); ?>
        </div>
      <?php endif; ?>

      <form action="php/unified_login.php" method="post" class="login-form">
        <input type="hidden" name="redirect" value="<?= $redirect ?>">

        <div class="input-group">
          <label for="identifier">Email / Username / Phone</label>
          <div class="input-wrap">
            <span class="input-icon">👤</span>
            <input type="text" id="identifier" name="identifier"
                   placeholder="Enter username, email, or phone" required>
          </div>
        </div>

        <div class="input-group">
          <label for="password">Password</label>
          <div class="input-wrap">
            <span class="input-icon">🔒</span>
            <input type="password" id="password" name="password"
                   placeholder="Enter your password" required>
          </div>
        </div>

        <div style="text-align:right;margin-top:-8px;margin-bottom:16px;">
          <a href="forgot-password.php"
             style="font-size:0.8rem;color:#e67a00;font-weight:600;text-decoration:none;">
            Forgot password?
          </a>
        </div>

        <button type="submit" class="auth-submit-btn">
          Login to My Account 🍯
        </button>
      </form>

      <div class="auth-divider">or</div>

      <p class="paragraph">
        Don't have an account? <a href="signup/signup.html">Create one free</a>
      </p>
      <p class="hint" style="margin-top:20px;">
        🔐 Admin? Use your admin credentials above.
      </p>

    </div>
  </div>

  <script src="js/darkmode.js"></script>
</body>
</html>
