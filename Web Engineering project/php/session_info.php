<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    start_secure_session();
}

// Never cache session state — always re-check with the server
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: Thu, 01 Jan 1970 00:00:00 GMT');
header('Content-Type: application/json; charset=utf-8');

json_response([
    'ok'            => true,
    'logged_in'     => !empty($_SESSION['customer_id']),
    'customer_id'   => $_SESSION['customer_id']   ?? null,
    'customer_name' => $_SESSION['customer_name'] ?? null,
    'customer_email'=> $_SESSION['customer_email'] ?? null,
]);
