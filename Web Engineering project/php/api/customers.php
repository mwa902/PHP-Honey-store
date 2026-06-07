<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/auth.php';
require_admin_api();

$conn = db();

$search = trim((string) ($_GET['search'] ?? ''));
$city = trim((string) ($_GET['city'] ?? ''));
$page = max(1, (int) ($_GET['page'] ?? 1));
$perPage = max(5, min(50, (int) ($_GET['per_page'] ?? 10)));
$offset = ($page - 1) * $perPage;

$where = 'WHERE 1=1';
$types = '';
$params = [];

if ($search !== '') {
    $where .= ' AND (username LIKE ? OR email LIKE ? OR CAST(phonenumber AS CHAR) LIKE ?)';
    $types .= 'sss';
    $like = '%' . $search . '%';
    $params = array_merge($params, [$like, $like, $like]);
}

if ($city !== '') {
    $where .= ' AND city LIKE ?';
    $types .= 's';
    $params[] = '%' . $city . '%';
}

$countSql = "SELECT COUNT(*) AS total FROM signupstore $where";
$countStmt = $conn->prepare($countSql);
if ($types !== '') {
    $countStmt->bind_param($types, ...$params);
}
$countStmt->execute();
$total = (int) ($countStmt->get_result()->fetch_assoc()['total'] ?? 0);

$sql = "SELECT s.customer_id, s.username AS name, s.email, s.phonenumber AS phone, s.city, s.created_at,
        (SELECT COUNT(*) FROM `customer order` o WHERE o.name = s.username) AS order_count
        FROM signupstore s
        $where
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?";

$stmt = $conn->prepare($sql);
$bindTypes = $types . 'ii';
$bindParams = array_merge($params, [$perPage, $offset]);
$stmt->bind_param($bindTypes, ...$bindParams);
$stmt->execute();
$result = $stmt->get_result();

$customers = [];
while ($row = $result->fetch_assoc()) {
    $customers[] = $row;
}

json_response([
    'ok' => true,
    'customers' => $customers,
    'pagination' => [
        'page' => $page,
        'per_page' => $perPage,
        'total' => $total,
        'total_pages' => (int) ceil($total / $perPage),
    ],
]);
