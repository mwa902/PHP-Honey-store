<?php
/**
 * Public endpoint — no admin auth needed.
 * POST: { items: [{ slug, name, quantity }] }
 * Returns: { ok, items: [{ slug, name, available, is_active, sufficient }] }
 */
declare(strict_types=1);
require_once dirname(__DIR__) . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$body  = read_json_body();
$items = isset($body['items']) && is_array($body['items']) ? $body['items'] : [];

$conn = db();

// Load all products indexed by slug and name
$catalog = [];
$res = $conn->query('SELECT product_id, name, slug, stock_quantity, is_active FROM products');
while ($r = $res->fetch_assoc()) {
    $catalog['slug:' . strtolower(trim($r['slug']))] = $r;
    $catalog['name:' . strtolower(trim($r['name']))] = $r;
}

$result = [];
foreach ($items as $item) {
    $slug = strtolower(trim((string)($item['slug'] ?? '')));
    $name = strtolower(trim((string)($item['name'] ?? '')));
    $qty  = max(1, (int)($item['quantity'] ?? 1));

    $prod = null;
    if ($slug && isset($catalog['slug:' . $slug])) {
        $prod = $catalog['slug:' . $slug];
    } elseif ($name && isset($catalog['name:' . $name])) {
        $prod = $catalog['name:' . $name];
    }

    if ($prod) {
        $available  = (int)$prod['stock_quantity'];
        $is_active  = (int)$prod['is_active'] === 1;
        $sufficient = $is_active && $available >= $qty;
        $result[] = [
            'product_id' => (int)$prod['product_id'],
            'slug'       => $prod['slug'],
            'name'       => $prod['name'],
            'available'  => $available,
            'requested'  => $qty,
            'is_active'  => $is_active,
            'sufficient' => $sufficient,
        ];
    }
}

json_response(['ok' => true, 'items' => $result]);
