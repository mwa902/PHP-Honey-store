<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/auth.php';
require_admin_api();

$conn = db();
$method = $_SERVER['REQUEST_METHOD'];
$body = read_json_body();

if ($method === 'GET') {
    $status = trim((string) ($_GET['status'] ?? 'all'));
    $sort = trim((string) ($_GET['sort'] ?? 'date_desc'));
    $search = trim((string) ($_GET['search'] ?? ''));

    $sql = "SELECT `order_row_id`, `order id` AS order_id, `name` AS customer, `product`, `amount`, `status`, `date`, `address`
            FROM `customer order` WHERE 1=1";
    $types = '';
    $params = [];

    if ($status !== '' && $status !== 'all') {
        $sql .= ' AND `status` = ?';
        $types .= 's';
        $params[] = $status;
    }

    if ($search !== '') {
        $sql .= ' AND (`order id` LIKE ? OR `name` LIKE ? OR `product` LIKE ?)';
        $types .= 'sss';
        $like = '%' . $search . '%';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    $orderBy = match ($sort) {
        'date_asc' => '`date` ASC, `order_row_id` ASC',
        'amount_desc' => '`amount` DESC',
        'amount_asc' => '`amount` ASC',
        'status' => '`status` ASC, `date` DESC',
        default => '`date` DESC, `order_row_id` DESC',
    };
    $sql .= ' ORDER BY ' . $orderBy;

    $stmt = $conn->prepare($sql);
    if ($types !== '') {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        $orders[] = $row;
    }

    json_response(['ok' => true, 'orders' => $orders]);
}

if ($method === 'PUT' || ($method === 'POST' && ($body['action'] ?? '') === 'update_status')) {
    $orderRowId = (int) ($body['order_row_id'] ?? 0);
    $newStatus = strtolower(trim((string) ($body['status'] ?? '')));
    $allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if ($orderRowId <= 0 || !in_array($newStatus, $allowed, true)) {
        json_response(['ok' => false, 'error' => 'Invalid order or status'], 400);
    }

    $stmt = $conn->prepare('UPDATE `customer order` SET `status` = ? WHERE `order_row_id` = ?');
    $stmt->bind_param('si', $newStatus, $orderRowId);
    $stmt->execute();

    json_response(['ok' => true, 'message' => 'Order status updated']);
}

json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
