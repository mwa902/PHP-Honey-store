<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/auth.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    require_admin_api();
}

$conn = db();
$method = $_SERVER['REQUEST_METHOD'];
$body = read_json_body();

function save_uploaded_image(string $field = 'image'): ?string
{
    if (empty($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $tmp = $_FILES[$field]['tmp_name'];
    $mime = mime_content_type($tmp);
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($allowed[$mime])) {
        json_response(['ok' => false, 'error' => 'Only JPG, PNG, WEBP, GIF images allowed'], 400);
    }

    $uploadDir = dirname(__DIR__, 2) . '/uploads/products';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $filename = 'product_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $allowed[$mime];
    $dest = $uploadDir . '/' . $filename;
    if (!move_uploaded_file($tmp, $dest)) {
        json_response(['ok' => false, 'error' => 'Image upload failed'], 500);
    }

    return '../uploads/products/' . $filename;
}

if ($method === 'GET') {
    $sql = 'SELECT p.product_id, p.category_id, c.name AS category_name, p.name, p.slug, p.description,
                   p.price, p.image_path, p.stock_quantity, p.low_stock_threshold, p.is_active
            FROM products p
            LEFT JOIN categories c ON c.category_id = p.category_id
            ORDER BY p.name ASC';
    $res = $conn->query($sql);
    $rows = [];
    while ($row = $res->fetch_assoc()) {
        $row['is_low_stock'] = (int) $row['stock_quantity'] <= (int) $row['low_stock_threshold'];
        $rows[] = $row;
    }
    json_response(['ok' => true, 'products' => $rows]);
}

if ($method === 'POST' && ($body['action'] ?? '') !== 'update') {
    $name = trim((string) ($body['name'] ?? $_POST['name'] ?? ''));
    $slug = trim((string) ($body['slug'] ?? $_POST['slug'] ?? ''));
    $description = trim((string) ($body['description'] ?? $_POST['description'] ?? ''));
    $price = (float) ($body['price'] ?? $_POST['price'] ?? 0);
    $categoryId = (int) ($body['category_id'] ?? $_POST['category_id'] ?? 0);
    $stock = (int) ($body['stock_quantity'] ?? $_POST['stock_quantity'] ?? 0);
    $lowStock = (int) ($body['low_stock_threshold'] ?? $_POST['low_stock_threshold'] ?? 5);
    $imagePath = trim((string) ($body['image_path'] ?? $_POST['image_path'] ?? ''));

    $uploaded = save_uploaded_image();
    if ($uploaded) {
        $imagePath = $uploaded;
    }

    if ($name === '' || $slug === '') {
        json_response(['ok' => false, 'error' => 'Name and slug are required'], 400);
    }

    if ($categoryId > 0) {
        $stmt = $conn->prepare(
            'INSERT INTO products (category_id, name, slug, description, price, image_path, stock_quantity, low_stock_threshold)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('isssdsii', $categoryId, $name, $slug, $description, $price, $imagePath, $stock, $lowStock);
    } else {
        $stmt = $conn->prepare(
            'INSERT INTO products (name, slug, description, price, image_path, stock_quantity, low_stock_threshold)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('sssdsii', $name, $slug, $description, $price, $imagePath, $stock, $lowStock);
    }
    $stmt->execute();

    json_response(['ok' => true, 'product_id' => $conn->insert_id]);
}

if ($method === 'PUT' || (($method === 'POST') && ($body['action'] ?? $_POST['action'] ?? '') === 'update')) {
    $productId = (int) ($body['product_id'] ?? $_POST['product_id'] ?? 0);
    $name = trim((string) ($body['name'] ?? $_POST['name'] ?? ''));
    $slug = trim((string) ($body['slug'] ?? $_POST['slug'] ?? ''));
    $description = trim((string) ($body['description'] ?? $_POST['description'] ?? ''));
    $price = (float) ($body['price'] ?? $_POST['price'] ?? 0);
    $categoryId = (int) ($body['category_id'] ?? $_POST['category_id'] ?? 0);
    $stock = (int) ($body['stock_quantity'] ?? $_POST['stock_quantity'] ?? 0);
    $lowStock = (int) ($body['low_stock_threshold'] ?? $_POST['low_stock_threshold'] ?? 5);
    $imagePath = trim((string) ($body['image_path'] ?? $_POST['image_path'] ?? ''));

    $uploaded = save_uploaded_image();
    if ($uploaded) {
        $imagePath = $uploaded;
    }

    if ($productId <= 0 || $name === '' || $slug === '') {
        json_response(['ok' => false, 'error' => 'Invalid product data'], 400);
    }

    if ($categoryId > 0) {
        if ($imagePath !== '') {
            $stmt = $conn->prepare(
                'UPDATE products SET category_id = ?, name = ?, slug = ?, description = ?, price = ?,
                 image_path = ?, stock_quantity = ?, low_stock_threshold = ? WHERE product_id = ?'
            );
            $stmt->bind_param('isssdsiii', $categoryId, $name, $slug, $description, $price, $imagePath, $stock, $lowStock, $productId);
        } else {
            $stmt = $conn->prepare(
                'UPDATE products SET category_id = ?, name = ?, slug = ?, description = ?, price = ?,
                 stock_quantity = ?, low_stock_threshold = ? WHERE product_id = ?'
            );
            $stmt->bind_param('isssdiii', $categoryId, $name, $slug, $description, $price, $stock, $lowStock, $productId);
        }
    } else {
        if ($imagePath !== '') {
            $stmt = $conn->prepare(
                'UPDATE products SET category_id = NULL, name = ?, slug = ?, description = ?, price = ?,
                 image_path = ?, stock_quantity = ?, low_stock_threshold = ? WHERE product_id = ?'
            );
            $stmt->bind_param('sssdsiii', $name, $slug, $description, $price, $imagePath, $stock, $lowStock, $productId);
        } else {
            $stmt = $conn->prepare(
                'UPDATE products SET category_id = NULL, name = ?, slug = ?, description = ?, price = ?,
                 stock_quantity = ?, low_stock_threshold = ? WHERE product_id = ?'
            );
            $stmt->bind_param('sssdiii', $name, $slug, $description, $price, $stock, $lowStock, $productId);
        }
    }
    $stmt->execute();

    json_response(['ok' => true, 'message' => 'Product updated']);
}

if ($method === 'DELETE') {
    $productId = (int) ($body['product_id'] ?? ($_GET['product_id'] ?? 0));
    if ($productId <= 0) {
        json_response(['ok' => false, 'error' => 'Invalid product id'], 400);
    }

    $stmt = $conn->prepare('UPDATE products SET is_active = 0 WHERE product_id = ?');
    $stmt->bind_param('i', $productId);
    $stmt->execute();

    json_response(['ok' => true, 'message' => 'Product removed']);
}

json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
