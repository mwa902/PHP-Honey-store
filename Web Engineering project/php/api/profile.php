<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    start_secure_session();
}

header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['customer_id'])) {
    json_response(['ok' => false, 'error' => 'Not logged in'], 401);
}

$conn = db();
$method = $_SERVER['REQUEST_METHOD'];
$body = read_json_body();
$customerId = (int) $_SESSION['customer_id'];

if ($method === 'GET') {
    $stmt = $conn->prepare(
        'SELECT customer_id, username, email, phonenumber, city, created_at
         FROM signupstore WHERE customer_id = ? LIMIT 1'
    );
    $stmt->bind_param('i', $customerId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        json_response(['ok' => false, 'error' => 'Customer not found'], 404);
    }

    unset($row['Password']);
    json_response(['ok' => true, 'customer' => $row]);
}

if ($method === 'POST') {
    $username = trim((string) ($body['username'] ?? ''));
    $email    = trim((string) ($body['email'] ?? ''));
    $phone    = trim((string) ($body['phonenumber'] ?? ''));
    $city     = trim((string) ($body['city'] ?? ''));

    if ($username === '' || $email === '') {
        json_response(['ok' => false, 'error' => 'Username and email are required'], 400);
    }

    $check = $conn->prepare(
        'SELECT customer_id FROM signupstore
         WHERE (email = ? OR username = ?) AND customer_id != ? LIMIT 1'
    );
    $check->bind_param('ssi', $email, $username, $customerId);
    $check->execute();
    if ($check->get_result()->fetch_assoc()) {
        json_response(['ok' => false, 'error' => 'Email or username already taken'], 409);
    }

    $stmt = $conn->prepare(
        'UPDATE signupstore SET username = ?, email = ?, phonenumber = ?, city = ?
         WHERE customer_id = ?'
    );
    $stmt->bind_param('ssssi', $username, $email, $phone, $city, $customerId);
    $stmt->execute();

    $_SESSION['customer_name']  = $username;
    $_SESSION['customer_email'] = $email;

    json_response(['ok' => true, 'message' => 'Profile updated']);
}

if ($method === 'PUT') {
    $action = trim((string) ($body['action'] ?? ''));

    if ($action === 'change_password') {
        $currentPwd = (string) ($body['current_password'] ?? '');
        $newPwd     = (string) ($body['new_password'] ?? '');

        if (strlen($newPwd) < 8) {
            json_response(['ok' => false, 'error' => 'New password must be at least 8 characters'], 400);
        }

        $stmt = $conn->prepare('SELECT Password FROM signupstore WHERE customer_id = ? LIMIT 1');
        $stmt->bind_param('i', $customerId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        if (!$row || !password_verify($currentPwd, (string) $row['Password'])) {
            json_response(['ok' => false, 'error' => 'Current password is incorrect'], 401);
        }

        $hash = password_hash($newPwd, PASSWORD_DEFAULT);
        $upd  = $conn->prepare('UPDATE signupstore SET Password = ? WHERE customer_id = ?');
        $upd->bind_param('si', $hash, $customerId);
        $upd->execute();

        json_response(['ok' => true, 'message' => 'Password updated']);
    }
}

json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
