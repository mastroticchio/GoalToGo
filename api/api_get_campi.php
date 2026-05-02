<?php
require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$id = $_POST['id'] ?? '';

if (empty($id)) {
    echo json_encode([
        "status" => "error",
        "message" => "id mancante"
    ]);
    exit;
}

$campi = getCampiByGestore($conn, $id);

if ($campi === false) {
    echo json_encode([
        "status" => "error",
        "message" => "Errore nel database"
    ]);
    exit;
}

echo json_encode([
    "status" => "success",
    "campi" => $campi
]);