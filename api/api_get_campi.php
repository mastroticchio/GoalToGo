<?php
require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

// =========================
// 1. PRENDO EMAIL
// =========================
$email = $_POST['email'] ?? '';

// =========================
// 2. VALIDAZIONE
// =========================
if (empty($email)) {
    echo json_encode([
        "status" => "error",
        "message" => "Email mancante"
    ]);
    exit;
}

// =========================
// 3. CHIAMATA FUNZIONE
// =========================
$campi = getCampiByGestore($conn, $email);

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