<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    start_secure_session();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../signup/signup.html');
    exit;
}

$username = trim((string) ($_POST['username'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$password = (string) ($_POST['password'] ?? '');
$phone = trim((string) ($_POST['phone'] ?? ''));
$city = trim((string) ($_POST['city'] ?? ''));

if ($username === '' || $email === '' || $password === '' || $phone === '') {
    $_SESSION['signup_error'] = 'All required fields must be filled.';
    header('Location: ../signup/signup.html');
    exit;
}

$conn = db();
$check = $conn->prepare('SELECT customer_id FROM signupstore WHERE email = ? OR username = ? LIMIT 1');
$check->bind_param('ss', $email, $username);
$check->execute();
if ($check->get_result()->fetch_assoc()) {
    $_SESSION['signup_error'] = 'Email or username already exists.';
    header('Location: ../signup/signup.html');
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare('INSERT INTO signupstore (username, email, Password, phonenumber, city) VALUES (?, ?, ?, ?, ?)');
$stmt->bind_param('sssss', $username, $email, $hash, $phone, $city);
$stmt->execute();

$_SESSION['signup_success'] = 'Account created successfully! Please log in.';
header('Location: ../login.php');
exit;
