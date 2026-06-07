<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/auth.php';
require_admin_api();

$conn   = db();
$method = $_SERVER['REQUEST_METHOD'];
$body   = read_json_body();
$adminId = (int) $_SESSION['admin_id'];

if ($method === 'GET') {
    $stmt = $conn->prepare(
        'SELECT admin_id, `admin username` AS username, email, phonenumber
         FROM admin WHERE admin_id = ? LIMIT 1'
    );
    $stmt->bind_param('i', $adminId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        json_response(['ok' => false, 'error' => 'Admin not found'], 404);
    }

    json_response(['ok' => true, 'profile' => $row]);
}

if ($method === 'POST') {
    $action = trim((string) ($body['action'] ?? ''));
    if ($action === 'change_password') {
        $currentPwd = (string) ($body['current_password'] ?? '');
        $newPwd     = (string) ($body['new_password'] ?? '');
        $confirmPwd = (string) ($body['confirm_password'] ?? '');

        if ($newPwd !== $confirmPwd) {
            json_response(['ok' => false, 'error' => 'New passwords do not match'], 400);
        }
        if (strlen($newPwd) < 8) {
            json_response(['ok' => false, 'error' => 'Password must be at least 8 characters'], 400);
        }

        $stmt = $conn->prepare('SELECT password FROM admin WHERE admin_id = ? LIMIT 1');
        $stmt->bind_param('i', $adminId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        if (!$row || !password_verify($currentPwd, (string) $row['password'])) {
            json_response(['ok' => false, 'error' => 'Current password is incorrect'], 401);
        }

        $hash = password_hash($newPwd, PASSWORD_DEFAULT);
        $upd  = $conn->prepare('UPDATE admin SET password = ? WHERE admin_id = ?');
        $upd->bind_param('si', $hash, $adminId);
        $upd->execute();

        json_response(['ok' => true, 'message' => 'Password updated successfully']);
    }

    if ($action === 'update_profile') {
        $username = trim((string) ($body['username'] ?? ''));
        $email    = trim((string) ($body['email'] ?? ''));
        $phone    = trim((string) ($body['phonenumber'] ?? ''));

        if ($username === '' || $email === '') {
            json_response(['ok' => false, 'error' => 'Name and email are required'], 400);
        }

        $stmt = $conn->prepare(
            'UPDATE admin SET `admin username` = ?, email = ?, phonenumber = ?
             WHERE admin_id = ?'
        );
        $stmt->bind_param('sssi', $username, $email, $phone, $adminId);
        $stmt->execute();

        $_SESSION['admin_username'] = $username;
        $_SESSION['admin_email']    = $email;
        $_SESSION['admin_phone']    = $phone;

        json_response(['ok' => true, 'message' => 'Profile updated']);
    }

    json_response(['ok' => false, 'error' => 'Unknown action'], 400);
}

json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
