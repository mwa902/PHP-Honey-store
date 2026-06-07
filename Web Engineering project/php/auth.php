<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    start_secure_session();
}

function require_admin_api(): void
{
    if (empty($_SESSION['admin_id'])) {
        json_response(['ok' => false, 'error' => 'Unauthorized'], 401);
    }
}

function require_admin_page(): void
{
    if (empty($_SESSION['admin_id'])) {
        header('Location: login.php');
        exit;
    }
}

function admin_session_bootstrap(array $row): void
{
    $_SESSION['admin_id'] = (int) $row['admin_id'];
    $_SESSION['admin_username'] = $row['admin_username'];
    $_SESSION['admin_email'] = $row['email'];
    $_SESSION['admin_phone'] = (string) $row['phonenumber'];
}
