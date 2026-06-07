<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/auth.php';
require_admin_api();

$conn = db();
$method = $_SERVER['REQUEST_METHOD'];
$body = read_json_body();

if ($method === 'GET') {
    $res = $conn->query('SELECT category_id, name, description, created_at FROM categories ORDER BY name ASC');
    $rows = [];
    while ($row = $res->fetch_assoc()) {
        $rows[] = $row;
    }
    json_response(['ok' => true, 'categories' => $rows]);
}

if ($method === 'POST') {
    $name = trim((string) ($body['name'] ?? ''));
    $description = trim((string) ($body['description'] ?? ''));
    if ($name === '') {
        json_response(['ok' => false, 'error' => 'Category name is required'], 400);
    }

    $stmt = $conn->prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    $stmt->bind_param('ss', $name, $description);
    $stmt->execute();
    json_response(['ok' => true, 'category_id' => $conn->insert_id]);
}

if ($method === 'PUT') {
    $id = (int) ($body['category_id'] ?? 0);
    $name = trim((string) ($body['name'] ?? ''));
    $description = trim((string) ($body['description'] ?? ''));
    if ($id <= 0 || $name === '') {
        json_response(['ok' => false, 'error' => 'Invalid category data'], 400);
    }

    $stmt = $conn->prepare('UPDATE categories SET name = ?, description = ? WHERE category_id = ?');
    $stmt->bind_param('ssi', $name, $description, $id);
    $stmt->execute();
    json_response(['ok' => true, 'message' => 'Category updated']);
}

if ($method === 'DELETE') {
    $id = (int) ($body['category_id'] ?? ($_GET['category_id'] ?? 0));
    if ($id <= 0) {
        json_response(['ok' => false, 'error' => 'Invalid category id'], 400);
    }

    $stmt = $conn->prepare('DELETE FROM categories WHERE category_id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    json_response(['ok' => true, 'message' => 'Category deleted']);
}

json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
