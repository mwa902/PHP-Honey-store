<?php
declare(strict_types=1);

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'my ecommerence');

// ── Session lifetime: 1 minute of inactivity ──────────────────────
define('SESSION_LIFETIME', 60); // seconds

function start_secure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;

    // Set cookie lifetime (browser-level)
    session_set_cookie_params([
        'lifetime' => SESSION_LIFETIME,
        'path'     => '/',
        'secure'   => false,   // set true if using HTTPS
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    // PHP garbage collection matches our timeout
    ini_set('session.gc_maxlifetime', (string) SESSION_LIFETIME);
    ini_set('session.gc_probability', '1');
    ini_set('session.gc_divisor',     '1');

    session_start();

    // ── Server-side timeout check ──────────────────────────────
    $now = time();

    // First request: stamp the time
    if (!isset($_SESSION['_last_active'])) {
        $_SESSION['_last_active'] = $now;
        return;
    }

    // Inactive too long → destroy and restart fresh
    if (($now - (int)$_SESSION['_last_active']) > SESSION_LIFETIME) {
        // Wipe session data
        $_SESSION = [];
        // Delete the session cookie
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(
                session_name(), '',
                time() - 42000,
                $p['path'], $p['domain'], $p['secure'], $p['httponly']
            );
        }
        session_destroy();

        // Start a clean new session
        session_start();
        $_SESSION['_last_active'] = $now;
        return;
    }

    // Still active — refresh timestamp on every request
    $_SESSION['_last_active'] = $now;
}

function db(): mysqli
{
    static $conn = null;
    if ($conn instanceof mysqli) {
        return $conn;
    }

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $conn->set_charset('utf8mb4');
    return $conn;
}

function json_response(array $payload, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}
