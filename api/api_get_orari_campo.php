<?php
require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$campo_id = $_POST['id'] ?? '';

if (empty($campo_id)) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'ID campo mancante'
    ]);
    exit;
}

$orari = getOrariByCampoId($conn, $campo_id);

if ($orari === false) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Errore nel database'
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'orari'  => $orari
]);