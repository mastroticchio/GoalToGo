<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require('gestore');

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

// usiamo l'id dalla sessione, non dal client
$id = auth_id();

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