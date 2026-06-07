<?php
// TEMPORARY DEBUG FILE — DELETE AFTER FIXING
declare(strict_types=1);
require_once __DIR__ . '/config.php';
if (session_status() !== PHP_SESSION_ACTIVE) start_secure_session();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

$body = read_json_body();
$conn = db();

// Show all products from DB
$products = [];
$res = $conn->query('SELECT product_id, name, slug, stock_quantity, is_active FROM products ORDER BY name');
while ($r = $res->fetch_assoc()) $products[] = $r;

// What was received
echo json_encode([
    'received_body'   => $body,
    'session'         => [
        'customer_id'   => $_SESSION['customer_id']   ?? null,
        'customer_name' => $_SESSION['customer_name'] ?? null,
    ],
    'db_products'     => $products,
    'cart_items_sent' => $body['cart_items'] ?? 'NOT SENT',
], JSON_PRETTY_PRINT);
