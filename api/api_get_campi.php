<?php
require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

// =========================
// 1. PRENDO EMAIL
// =========================
$id = $_POST['id'] ?? '';

// =========================
// 2. VALIDAZIONE
// =========================
if (empty($id)) {
    echo json_encode([
        "status" => "error",
        "message" => "id mancante"
    ]);
    exit;
}

// =========================
// 3. CHIAMATA FUNZIONE
// =========================
$campi = getCampiByGestore($conn, $id);

if ($campi === false) {
    echo json_encode([
        "status" => "error",
        "message" => "Errore nel database"
    ]);
    exit;
}

// =========================
// 4. RISPOSTA
// =========================
echo json_encode([
    "status" => "success",
    "campi" => $campi
]);