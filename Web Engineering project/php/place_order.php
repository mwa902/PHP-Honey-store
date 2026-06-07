<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';
if (session_status() !== PHP_SESSION_ACTIVE) start_secure_session();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

// ── Log helper (writes to log file for debugging) ─────────────────
$logFile = __DIR__ . '/order_debug.log';
function logMsg(string $msg): void {
    global $logFile;
    file_put_contents($logFile, date('[Y-m-d H:i:s] ') . $msg . "\n", FILE_APPEND | LOCK_EX);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['ok' => false, 'error' => 'POST required'], 405);
}

$rawBody = file_get_contents('php://input');
logMsg("RAW BODY: " . $rawBody);
logMsg("SESSION: " . json_encode($_SESSION));

$body = json_decode($rawBody, true);
if (!is_array($body)) {
    $body = $_POST;
    logMsg("JSON decode failed, using POST: " . json_encode($body));
}

$customerId   = isset($_SESSION['customer_id']) ? (int)$_SESSION['customer_id'] : null;
$customerName = !empty($_SESSION['customer_name'])
    ? (string)$_SESSION['customer_name']
    : trim((string)($body['customer_name'] ?? ''));
$address      = trim((string)($body['address'] ?? ''));
$amount       = (int)round((float)($body['amount'] ?? 0));
$cartItems    = isset($body['cart_items']) && is_array($body['cart_items']) ? $body['cart_items'] : [];
$productStr   = trim((string)($body['product'] ?? ''));

logMsg("customerName=$customerName address=$address amount=$amount cartItems=" . json_encode($cartItems));

// ── Validation ─────────────────────────────────────────────────────
$errors = [];
if ($customerName === '') $errors[] = 'Not logged in';
if ($amount <= 0)         $errors[] = 'Amount is zero';
if ($address === '')      $errors[] = 'Address is empty';
if (empty($cartItems) && $productStr === '') $errors[] = 'Cart is empty';

if (!empty($errors)) {
    logMsg("VALIDATION FAILED: " . implode('; ', $errors));
    json_response(['ok' => false, 'error' => implode('; ', $errors)], 400);
}

$conn = db();

// ── Load all products by slug AND name ─────────────────────────────
$catalog = [];
$res = $conn->query('SELECT product_id, name, slug, stock_quantity, is_active FROM products');
while ($r = $res->fetch_assoc()) {
    $catalog['slug:' . strtolower(trim($r['slug']))] = $r;
    $catalog['name:' . strtolower(trim($r['name']))] = $r;
}
logMsg("Loaded " . (count($catalog) / 2) . " products from DB");

function findProd(array $item, array $catalog): ?array {
    $slug = strtolower(trim((string)($item['slug'] ?? '')));
    $name = strtolower(trim((string)($item['name'] ?? '')));
    if ($slug && isset($catalog['slug:' . $slug])) return $catalog['slug:' . $slug];
    if ($name && isset($catalog['name:' . $name])) return $catalog['name:' . $name];
    // Partial match fallback
    foreach ($catalog as $key => $prod) {
        if (strpos($key, 'name:') === 0 && $name) {
            $dbName = substr($key, 5);
            if (strpos($dbName, $name) !== false || strpos($name, $dbName) !== false) {
                return $prod;
            }
        }
    }
    return null;
}

// ── Phase 1: Stock validation ──────────────────────────────────────
if (!empty($cartItems)) {
    foreach ($cartItems as $item) {
        $itemQty = max(1, (int)($item['quantity'] ?? 1));
        $prod = findProd($item, $catalog);
        logMsg("Validating: name='" . ($item['name'] ?? '') . "' slug='" . ($item['slug'] ?? '') . "' qty=$itemQty => " . ($prod ? "found id={$prod['product_id']} stock={$prod['stock_quantity']}" : "NOT FOUND"));

        if (!$prod) continue;

        if (!(int)$prod['is_active']) {
            logMsg("BLOCKED: product inactive");
            json_response(['ok' => false, 'error' => '"' . $prod['name'] . '" is no longer available.'], 400);
        }

        $available = (int)$prod['stock_quantity'];
        if ($available < $itemQty) {
            $msg = $available === 0
                ? '"' . $prod['name'] . '" is sold out.'
                : '"' . $prod['name'] . '" only has ' . $available . ' unit(s) left.';
            logMsg("BLOCKED: insufficient stock ($available < $itemQty)");
            json_response(['ok' => false, 'error' => $msg], 400);
        }
    }
}

// ── Phase 2: Deduct stock ──────────────────────────────────────────
if (!empty($cartItems)) {
    $conn->begin_transaction();
    try {
        foreach ($cartItems as $item) {
            $itemQty = max(1, (int)($item['quantity'] ?? 1));
            $prod = findProd($item, $catalog);
            if (!$prod) { logMsg("SKIP deduct — product not found for: " . json_encode($item)); continue; }

            $productId = (int)$prod['product_id'];
            $stmt = $conn->prepare(
                'UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE product_id = ? AND stock_quantity >= ?'
            );
            $stmt->bind_param('iii', $itemQty, $productId, $itemQty);
            $stmt->execute();
            $affected = $stmt->affected_rows;
            logMsg("DEDUCTED: product_id=$productId qty=$itemQty affected_rows=$affected");
        }

        $productStr = implode(', ', array_map(function($i) {
            $qty = max(1, (int)($i['quantity'] ?? 1));
            return trim((string)($i['name'] ?? '')) . ($qty > 1 ? ' x' . $qty : '');
        }, $cartItems));

        $conn->commit();
        logMsg("TRANSACTION COMMITTED");

    } catch (\Throwable $e) {
        $conn->rollback();
        logMsg("TRANSACTION ROLLED BACK: " . $e->getMessage());
        json_response(['ok' => false, 'error' => 'Stock update failed: ' . $e->getMessage()], 500);
    }
}

// ── Phase 3: Insert order ──────────────────────────────────────────
$orderId = 'ORD-' . strtoupper(substr(md5(uniqid('', true)), 0, 6));
$status  = 'pending';
$date    = date('Y-m-d');

$hasCol = false;
$r = $conn->query("SHOW COLUMNS FROM `customer order` LIKE 'customer_id'");
if ($r && $r->num_rows > 0) $hasCol = true;

try {
    if ($hasCol && $customerId !== null) {
        $stmt = $conn->prepare('INSERT INTO `customer order` (`customer_id`,`order id`,`name`,`product`,`amount`,`status`,`date`,`address`) VALUES (?,?,?,?,?,?,?,?)');
        $stmt->bind_param('isssisss', $customerId, $orderId, $customerName, $productStr, $amount, $status, $date, $address);
    } else {
        $stmt = $conn->prepare('INSERT INTO `customer order` (`order id`,`name`,`product`,`amount`,`status`,`date`,`address`) VALUES (?,?,?,?,?,?,?)');
        $stmt->bind_param('sssisss', $orderId, $customerName, $productStr, $amount, $status, $date, $address);
    }
    $stmt->execute();
    logMsg("ORDER INSERTED: $orderId");
} catch (\mysqli_sql_exception $e) {
    logMsg("ORDER INSERT FAILED: " . $e->getMessage());
    json_response(['ok' => false, 'error' => 'DB insert failed: ' . $e->getMessage()], 500);
}

logMsg("SUCCESS: order_id=$orderId");
json_response(['ok' => true, 'order_id' => $orderId]);
