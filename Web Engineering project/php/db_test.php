<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
header('Content-Type: text/plain; charset=utf-8');

$conn = db();
echo "=== PRODUCTS TABLE ===\n";
$res = $conn->query('SELECT product_id, name, slug, stock_quantity, is_active FROM products ORDER BY product_id');
if ($res) {
    $count = 0;
    while ($r = $res->fetch_assoc()) {
        echo "ID:{$r['product_id']} | name:{$r['name']} | slug:{$r['slug']} | stock:{$r['stock_quantity']} | active:{$r['is_active']}\n";
        $count++;
    }
    echo "Total: $count products\n";
} else {
    echo "ERROR on products: " . $conn->error . "\n";
}

echo "\n=== TEST STOCK UPDATE (product_id=1) ===\n";
$res3 = $conn->query('SELECT product_id, name, stock_quantity FROM products WHERE product_id = 1');
if ($res3 && $res3->num_rows > 0) {
    $before = $res3->fetch_assoc();
    echo "Before: stock={$before['stock_quantity']}\n";
    $qty = 1; $pid = 1;
    $stmt = $conn->prepare('UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE product_id = ? AND stock_quantity >= ?');
    $stmt->bind_param('iii', $qty, $pid, $qty);
    $ok = $stmt->execute();
    $affected = $stmt->affected_rows;
    echo "execute=" . ($ok ? 'true' : 'false') . " affected_rows=$affected\n";
    $after = $conn->query('SELECT stock_quantity FROM products WHERE product_id=1')->fetch_assoc();
    echo "After: stock={$after['stock_quantity']}\n";
    // Roll back
    $conn->query("UPDATE products SET stock_quantity = stock_quantity + 1 WHERE product_id = 1");
    echo "Rolled back +1\n";
} else {
    echo "product_id=1 not found\n";
    // try first available
    $res4 = $conn->query('SELECT product_id, name, stock_quantity FROM products LIMIT 1');
    if ($res4 && $r4 = $res4->fetch_assoc()) {
        $pid = (int)$r4['product_id']; $qty = 1;
        echo "Using product_id=$pid name={$r4['name']} stock={$r4['stock_quantity']}\n";
        $stmt = $conn->prepare('UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE product_id = ? AND stock_quantity >= ?');
        $stmt->bind_param('iii', $qty, $pid, $qty);
        $ok = $stmt->execute();
        echo "execute=" . ($ok ? 'true' : 'false') . " affected={$stmt->affected_rows}\n";
        $after = $conn->query("SELECT stock_quantity FROM products WHERE product_id=$pid")->fetch_assoc();
        echo "After: stock={$after['stock_quantity']}\n";
        $conn->query("UPDATE products SET stock_quantity = stock_quantity + 1 WHERE product_id=$pid");
        echo "Rolled back\n";
    }
}

echo "\n=== CUSTOMER ORDER TABLE COLUMNS ===\n";
$res2 = $conn->query('SHOW COLUMNS FROM `customer order`');
if ($res2) {
    while ($r = $res2->fetch_assoc()) {
        echo "Field:{$r['Field']} | Type:{$r['Type']} | Null:{$r['Null']} | Key:{$r['Key']}\n";
    }
} else {
    echo "ERROR: " . $conn->error . "\n";
    // Try different table name
    $tables = $conn->query('SHOW TABLES');
    echo "\nAll tables in DB:\n";
    while ($t = $tables->fetch_array()) echo "  " . $t[0] . "\n";
}
