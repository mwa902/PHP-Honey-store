<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
header('Content-Type: text/html; charset=utf-8');

$conn = db();

echo "<h2>All products in DB:</h2><pre>";
$res = $conn->query('SELECT product_id, name, slug, stock_quantity, is_active FROM products ORDER BY name');
$products = [];
while ($r = $res->fetch_assoc()) {
    $products[] = $r;
    echo print_r($r, true);
}
echo "</pre>";

if (!empty($products)) {
    $first = $products[0];
    echo "<h2>Testing UPDATE on product_id={$first['product_id']} (name={$first['name']}, slug={$first['slug']}, stock={$first['stock_quantity']})</h2>";

    $slug = $first['slug'];
    $qty  = 1;

    $stmt = $conn->prepare('UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE product_id = ? AND stock_quantity >= ?');
    $stmt->bind_param('iii', $qty, $first['product_id'], $qty);
    $ok = $stmt->execute();
    $affected = $stmt->affected_rows;
    echo "<p>Execute result: " . ($ok ? 'true' : 'false') . " | affected_rows: $affected</p>";

    // Show new value
    $r2 = $conn->query("SELECT stock_quantity FROM products WHERE product_id={$first['product_id']}")->fetch_assoc();
    echo "<p>New stock_quantity: {$r2['stock_quantity']}</p>";

    // Roll it back (add 1 back)
    $conn->query("UPDATE products SET stock_quantity = stock_quantity + 1 WHERE product_id = {$first['product_id']}");
    echo "<p style='color:green'>Rolled back +1 to restore original stock.</p>";
}

// 3) Check the customer order table columns
echo "<h2>Columns in 'customer order' table:</h2><pre>";
$res2 = $conn->query("SHOW COLUMNS FROM `customer order`");
while ($row = $res2->fetch_assoc()) echo print_r($row, true);
echo "</pre>";
