<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    start_secure_session();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../login.php');
    exit;
}

$identifier = trim((string) ($_POST['username'] ?? ''));
$password = (string) ($_POST['password'] ?? '');

$conn = db();
$phoneAlt = '';
if (ctype_digit($identifier)) {
    if (substr($identifier, 0, 1) === '0') {
        $phoneAlt = substr($identifier, 1);
    } else {
        $phoneAlt = '0' . $identifier;
    }
}

$stmt = $conn->prepare(
    'SELECT customer_id, username, email FROM signupstore
     WHERE username = ? OR email = ? OR phonenumber = ? OR (phonenumber = ? AND ? != \'\')
     LIMIT 1'
);
$stmt->bind_param('sssss', $identifier, $identifier, $identifier, $phoneAlt, $phoneAlt);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

if (!$row) {
    $_SESSION['login_error'] = 'Invalid username/email/phone or password.';
    header('Location: ../login.php');
    exit;
}

$passStmt = $conn->prepare('SELECT Password FROM signupstore WHERE customer_id = ? LIMIT 1');
$passStmt->bind_param('i', $row['customer_id']);
$passStmt->execute();
$passRow = $passStmt->get_result()->fetch_assoc();

if (!$row || !$passRow || !password_verify($password, (string) $passRow['Password'])) {
    $_SESSION['login_error'] = 'Invalid username/email/phone or password.';
    header('Location: ../login.php');
    exit;
}

$_SESSION['customer_id'] = (int) $row['customer_id'];
$_SESSION['customer_name'] = $row['username'];
$_SESSION['customer_email'] = $row['email'];

header('Location: ../home/home.html');
exit;
