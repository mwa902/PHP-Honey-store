<?php
declare(strict_types=1);
require_once __DIR__ . '/php/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    start_secure_session();
}

// Prevent caching so back button always re-checks session
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');

$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $step = trim((string) ($_POST['step'] ?? ''));

    if ($step === 'verify') {
        $identifier = trim((string) ($_POST['identifier'] ?? ''));
        if ($identifier === '') {
            $message = 'Please enter your email or username.';
            $messageType = 'error';
        } else {
            $conn = db();
            $stmt = $conn->prepare(
                'SELECT customer_id, username, email FROM signupstore
                 WHERE email = ? OR username = ? LIMIT 1'
            );
            $stmt->bind_param('ss', $identifier, $identifier);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();

            if ($row) {
                $_SESSION['reset_customer_id'] = (int) $row['customer_id'];
                $_SESSION['reset_customer_email'] = $row['email'];
                $message = 'Account found! You can now set a new password.';
                $messageType = 'success';
            } else {
                $message = 'No account found with that email or username.';
                $messageType = 'error';
            }
        }
    }

    if ($step === 'reset') {
        $newPwd     = (string) ($_POST['new_password'] ?? '');
        $confirmPwd = (string) ($_POST['confirm_password'] ?? '');

        if (empty($_SESSION['reset_customer_id'])) {
            $message = 'Session expired. Please start again.';
            $messageType = 'error';
        } elseif (strlen($newPwd) < 8) {
            $message = 'Password must be at least 8 characters.';
            $messageType = 'error';
        } elseif ($newPwd !== $confirmPwd) {
            $message = 'Passwords do not match.';
            $messageType = 'error';
        } else {
            $conn = db();
            $hash = password_hash($newPwd, PASSWORD_DEFAULT);
            $stmt = $conn->prepare('UPDATE signupstore SET Password = ? WHERE customer_id = ?');
            $stmt->bind_param('si', $hash, $_SESSION['reset_customer_id']);
            $stmt->execute();

            unset($_SESSION['reset_customer_id'], $_SESSION['reset_customer_email']);
            $message = 'Password reset successfully! You can now log in.';
            $messageType = 'done';
        }
    }
}

$showReset  = !empty($_SESSION['reset_customer_id']) && $messageType !== 'done';
$showVerify = !$showReset && $messageType !== 'done';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Forgot Password – Honey Sugar Bakery</title>
  <link rel="stylesheet" href="login.css" />
  <link rel="stylesheet" href="js/darkmode.css" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    .step-label { font-size:.74rem; color:#a66a00; text-align:center; margin-bottom:18px; font-weight:700; letter-spacing:.8px; text-transform:uppercase; background:rgba(230,168,0,.1); padding:7px 14px; border-radius:20px; display:block; }
    body.dark-mode .step-label { background:rgba(230,168,0,.08); color:#a07840; }
  </style>
</head>
<body class="login-page-body">

  <button class="dm-toggle-btn" id="dmToggle" title="Switch to Dark Mode"
    aria-label="Switch to Dark Mode"
    style="position:fixed;top:18px;right:18px;z-index:9999;">🌙</button>

  <!-- LEFT PANEL -->
  <div class="auth-left">
    <div class="hex-bg">
      <div class="hex"></div><div class="hex"></div><div class="hex"></div>
      <div class="hex"></div><div class="hex"></div><div class="hex"></div>
      <div class="hex"></div><div class="hex"></div>
    </div>
    <div class="auth-left-inner">
      <div class="auth-brand">
        <img src="home/bee.png" alt="Logo" class="auth-brand-logo" onerror="this.style.display='none'">
        <div class="auth-brand-name">Honey Sugar<span>Bakery</span></div>
      </div>
      <span class="auth-hero-emoji">🔑</span>
      <h2>Reset Your <span>Password</span></h2>
      <p>Don't worry — it happens to the best of us. Enter your email or username and we'll help you get back in quickly.</p>
      <div class="auth-features">
        <div class="auth-feature-item">
          <span class="feat-icon">🔒</span>
          <div class="feat-text">
            <strong>Secure Reset</strong>
            <span>Your account security is our top priority</span>
          </div>
        </div>
        <div class="auth-feature-item">
          <span class="feat-icon">⚡</span>
          <div class="feat-text">
            <strong>Quick &amp; Easy</strong>
            <span>Reset your password in just two simple steps</span>
          </div>
        </div>
        <div class="auth-feature-item">
          <span class="feat-icon">🍯</span>
          <div class="feat-text">
            <strong>Back to Sweetness</strong>
            <span>Get back to your honey orders in no time</span>
          </div>
        </div>
      </div>
      <p class="auth-tagline"><strong>"Pure from the hive, straight to your heart."</strong></p>
    </div>
  </div>

  <!-- RIGHT PANEL -->
  <div class="auth-right">
    <div class="auth-form-wrap">

      <a href="login.php" class="auth-back-home">← Back to Login</a>

      <h2>Forgot Password 🔑</h2>
      <p class="auth-subtitle">We'll help you get back into your account</p>

      <?php if ($message): ?>
        <div class="auth-alert <?= $messageType === 'error' ? 'error' : 'success' ?>">
          <?= $messageType === 'error' ? '❌' : '✅' ?> <?= htmlspecialchars($message) ?>
        </div>
      <?php endif; ?>

      <?php if ($messageType === 'done'): ?>
        <p style="text-align:center;color:#5a3a00;font-size:.9rem;margin-bottom:24px;line-height:1.6;">
          Your password has been updated successfully. You can now log in with your new password.
        </p>
        <a href="login.php" class="auth-submit-btn" style="text-decoration:none;display:flex;">
          Go to Login 🍯
        </a>

      <?php elseif ($showReset): ?>
        <span class="step-label">Step 2 of 2 — Set New Password</span>
        <p style="font-size:.84rem;color:#8c5500;margin-bottom:20px;text-align:center;">
          Resetting for: <strong><?= htmlspecialchars($_SESSION['reset_customer_email']) ?></strong>
        </p>
        <form action="forgot-password.php" method="post" class="login-form">
          <input type="hidden" name="step" value="reset" />
          <div class="input-group">
            <label for="new_password">New Password</label>
            <div class="input-wrap">
              <span class="input-icon">🔒</span>
              <input type="password" id="new_password" name="new_password" placeholder="Min 8 characters" required minlength="8" />
            </div>
          </div>
          <div class="input-group">
            <label for="confirm_password">Confirm New Password</label>
            <div class="input-wrap">
              <span class="input-icon">🔒</span>
              <input type="password" id="confirm_password" name="confirm_password" placeholder="Repeat new password" required minlength="8" />
            </div>
          </div>
          <button type="submit" class="auth-submit-btn">Reset Password</button>
        </form>

      <?php else: ?>
        <span class="step-label">Step 1 of 2 — Verify Your Account</span>
        <form action="forgot-password.php" method="post" class="login-form">
          <input type="hidden" name="step" value="verify" />
          <div class="input-group">
            <label for="identifier">Email or Username</label>
            <div class="input-wrap">
              <span class="input-icon">👤</span>
              <input type="text" id="identifier" name="identifier" placeholder="Enter your email or username" required />
            </div>
          </div>
          <button type="submit" class="auth-submit-btn">Find My Account</button>
        </form>
      <?php endif; ?>

      <div class="auth-divider">or</div>
      <p class="paragraph"><a href="login.php">← Back to Login</a></p>

    </div>
  </div>

  <script src="js/darkmode.js"></script>
</body>
</html>
