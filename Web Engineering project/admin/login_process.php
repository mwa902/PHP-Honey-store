<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: login.php');
    exit;
}

$identifier = trim((string) ($_POST['identifier'] ?? ''));
$password = (string) ($_POST['password'] ?? '');

if ($identifier === '' || $password === '') {
    $_SESSION['login_error'] = 'Please enter your login details.';
    header('Location: login.php');
    exit;
}

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
    'SELECT admin_id, `admin username` AS admin_username, email, phonenumber, password
     FROM admin
     WHERE `admin username` = ? OR email = ? OR phonenumber = ? OR (phonenumber = ? AND ? != \'\')
     LIMIT 1'
);

$stmt->bind_param('sssss', $identifier, $identifier, $identifier, $phoneAlt, $phoneAlt);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

if (!$row || !password_verify($password, (string) $row['password'])) {
    $_SESSION['login_error'] = 'Invalid credentials. Check email/username/mobile and password.';
    header('Location: login.php');
    exit;
}

admin_session_bootstrap($row);
header('Location: admin.php');
exit;
