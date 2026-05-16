<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require();

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

// accetta id da query string o da body JSON
$id = 0;
if (isset($_GET['id'])) {
    $id = (int) $_GET['id'];
} else {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (is_array($data) && isset($data['id'])) $id = (int) $data['id'];
}

if ($id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'id mancante']);
    exit;
}

$campo = getCampoById($conn, $id);

if (!$campo) {
    echo json_encode(['status' => 'error', 'message' => 'Campo non trovato']);
    exit;
}

echo json_encode(['status' => 'success', 'campo' => $campo]);

mysqli_close($conn);
?>
