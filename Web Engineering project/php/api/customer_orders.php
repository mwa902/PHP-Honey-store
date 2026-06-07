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

$conn         = db();
$method       = $_SERVER['REQUEST_METHOD'];
$body         = read_json_body();
$customerId   = (int) $_SESSION['customer_id'];
$customerName = (string) ($_SESSION['customer_name'] ?? '');

function hasCustomerIdCol(\mysqli $conn): bool {
    $r = $conn->query("SHOW COLUMNS FROM `customer order` LIKE 'customer_id'");
    return $r && $r->num_rows > 0;
}

if ($method === 'GET') {
    $statusFilter = trim((string) ($_GET['status'] ?? 'all'));

    if (hasCustomerIdCol($conn)) {
        $sql    = "SELECT `order_row_id`, `order id` AS order_id, `name` AS customer,
                          `product`, `amount`, `status`, `date`, `address`
                   FROM `customer order`
                   WHERE (`customer_id` = ? OR (`customer_id` IS NULL AND `name` = ?))";
        $types  = 'is';
        $params = [$customerId, $customerName];
    } else {
        $sql    = "SELECT `order_row_id`, `order id` AS order_id, `name` AS customer,
                          `product`, `amount`, `status`, `date`, `address`
                   FROM `customer order`
                   WHERE `name` = ?";
        $types  = 's';
        $params = [$customerName];
    }

    if ($statusFilter !== '' && $statusFilter !== 'all') {
        $sql   .= ' AND `status` = ?';
        $types .= 's';
        $params[] = $statusFilter;
    }

    $sql .= ' ORDER BY `date` DESC, `order_row_id` DESC';

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orders[] = $row;
    }

    json_response(['ok' => true, 'orders' => $orders]);
}

if ($method === 'POST' && ($body['action'] ?? '') === 'reorder') {
    $orderRowId = (int) ($body['order_row_id'] ?? 0);
    if ($orderRowId <= 0) {
        json_response(['ok' => false, 'error' => 'Invalid order'], 400);
    }

    $stmt = $conn->prepare(
        "SELECT `product`, `amount`, `address` FROM `customer order`
         WHERE `order_row_id` = ? AND (`name` = ? OR `customer_id` = ?) LIMIT 1"
    );
    $stmt->bind_param('isi', $orderRowId, $customerName, $customerId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        json_response(['ok' => false, 'error' => 'Order not found'], 404);
    }

    $newOrderId = 'ORD-' . strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 6));
    $newStatus  = 'pending';
    $date       = date('Y-m-d');
    $address    = trim((string) ($body['address'] ?? $row['address'] ?? ''));
    $amount     = (int) $row['amount'];

    try {
        if (hasCustomerIdCol($conn)) {
            $stmt2 = $conn->prepare(
                'INSERT INTO `customer order`
                 (`customer_id`, `order id`, `name`, `product`, `amount`, `status`, `date`, `address`)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt2->bind_param('isssiss', $customerId, $newOrderId, $customerName, $row['product'], $amount, $newStatus, $date, $address);
        } else {
            $stmt2 = $conn->prepare(
                'INSERT INTO `customer order`
                 (`order id`, `name`, `product`, `amount`, `status`, `date`, `address`)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt2->bind_param('sssiss', $newOrderId, $customerName, $row['product'], $amount, $newStatus, $date, $address);
        }
        $stmt2->execute();
    } catch (\mysqli_sql_exception $e) {
        $stmt2 = $conn->prepare(
            'INSERT INTO `customer order`
             (`order id`, `name`, `product`, `amount`, `status`, `date`, `address`)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt2->bind_param('sssiss', $newOrderId, $customerName, $row['product'], $amount, $newStatus, $date, $address);
        $stmt2->execute();
    }

    json_response(['ok' => true, 'order_id' => $newOrderId, 'message' => 'Reorder placed successfully']);
}

json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
