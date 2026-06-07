<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/auth.php';
require_admin_api();

$conn = db();

$stats = [
    'total_sales' => 0,
    'total_orders' => 0,
    'total_categories' => 0,
    'total_products' => 0,
    'total_customers' => 0,
];

$res = $conn->query('SELECT COALESCE(SUM(`amount`), 0) AS total FROM `customer order` WHERE `status` <> "cancelled"');
$stats['total_sales'] = (float) ($res->fetch_assoc()['total'] ?? 0);

$res = $conn->query('SELECT COUNT(*) AS c FROM `customer order`');
$stats['total_orders'] = (int) ($res->fetch_assoc()['c'] ?? 0);

$res = $conn->query('SELECT COUNT(*) AS c FROM categories');
$stats['total_categories'] = (int) ($res->fetch_assoc()['c'] ?? 0);

$res = $conn->query('SELECT COUNT(*) AS c FROM products WHERE is_active = 1');
$stats['total_products'] = (int) ($res->fetch_assoc()['c'] ?? 0);

$res = $conn->query('SELECT COUNT(*) AS c FROM signupstore');
$stats['total_customers'] = (int) ($res->fetch_assoc()['c'] ?? 0);

$statusBreakdown = [];
$res = $conn->query('SELECT `status`, COUNT(*) AS c FROM `customer order` GROUP BY `status`');
while ($row = $res->fetch_assoc()) {
    $statusBreakdown[] = ['status' => $row['status'], 'count' => (int) $row['c']];
}

$monthlySales = [];
$res = $conn->query(
    "SELECT DATE_FORMAT(`date`, '%b %Y') AS label, COALESCE(SUM(`amount`), 0) AS total
     FROM `customer order`
     WHERE `status` <> 'cancelled'
     GROUP BY YEAR(`date`), MONTH(`date`)
     ORDER BY YEAR(`date`), MONTH(`date`)
     LIMIT 12"
);
while ($row = $res->fetch_assoc()) {
    $monthlySales[] = ['label' => $row['label'], 'total' => (float) $row['total']];
}

$topProducts = [];
$res = $conn->query(
    "SELECT `product` AS name, SUM(`amount`) AS revenue, COUNT(*) AS orders
     FROM `customer order`
     WHERE `status` <> 'cancelled'
     GROUP BY `product`
     ORDER BY revenue DESC
     LIMIT 5"
);
while ($row = $res->fetch_assoc()) {
    $topProducts[] = [
        'name' => $row['name'],
        'revenue' => (float) $row['revenue'],
        'orders' => (int) $row['orders'],
    ];
}

$recentOrders = [];
$res = $conn->query(
    "SELECT `order_row_id`, `order id` AS order_id, `name` AS customer, `product`, `amount`, `status`, `date`
     FROM `customer order`
     ORDER BY `date` DESC, `order_row_id` DESC
     LIMIT 8"
);
while ($row = $res->fetch_assoc()) {
    $recentOrders[] = $row;
}

$lowStock = [];
$res = $conn->query(
    'SELECT product_id, name, stock_quantity, low_stock_threshold
     FROM products
     WHERE is_active = 1 AND stock_quantity <= low_stock_threshold
     ORDER BY stock_quantity ASC
     LIMIT 10'
);
while ($row = $res->fetch_assoc()) {
    $lowStock[] = $row;
}

json_response([
    'ok' => true,
    'stats' => $stats,
    'status_breakdown' => $statusBreakdown,
    'monthly_sales' => $monthlySales,
    'top_products' => $topProducts,
    'recent_orders' => $recentOrders,
    'low_stock' => $lowStock,
]);
