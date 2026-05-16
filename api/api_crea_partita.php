<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require('giocatore');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

// accetto sia JSON che form-encoded, JSON ha la precedenza
$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$nome          = trim($data['nome']     ?? '');
$orario        = trim($data['orario']   ?? '');
$fk_campo      = (int)($data['fk_campo'] ?? 0);
$max_giocatori = (int)($data['max_giocatori'] ?? 10);

if ($nome === '' || $orario === '' || $fk_campo <= 0) {
    echo json_encode([
        "status"  => "error",
        "message" => "Campi obbligatori mancanti"
    ]);
    exit;
}

if (mb_strlen($nome) > 40) {
    echo json_encode([
        "status"  => "error",
        "message" => "Il nome non può superare i 40 caratteri"
    ]);
    exit;
}

// ORARIO è varchar(16) sul db, ISO datetime-local "YYYY-MM-DDTHH:MM" = 16 char
if (mb_strlen($orario) > 16) {
    $orario = substr($orario, 0, 16);
}

// Vincolo: solo per il giorno corrente (uso giornaliero).
$today = date('Y-m-d');
if (strpos($orario, $today) !== 0) {
    echo json_encode([
        "status"  => "error",
        "message" => "Si crea una partita solo per oggi."
    ]);
    exit;
}

// Vincolo: orari validi 10:00-22:00.
if (preg_match('/T(\d{2}):/', $orario, $m)) {
    $h = (int) $m[1];
    if ($h < 10 || $h > 22) {
        echo json_encode([
            "status"  => "error",
            "message" => "Gli orari validi sono dalle 10:00 alle 22:00."
        ]);
        exit;
    }
}

$ok = creaPartita($conn, $nome, $orario, $fk_campo, $max_giocatori);

if ($ok) {
    echo json_encode([
        "status"     => "success",
        "message"    => "Partita creata!",
        "partita_id" => mysqli_insert_id($conn)
    ]);
} else {
    echo json_encode([
        "status"  => "error",
        "message" => "Errore database: " . mysqli_error($conn)
    ]);
}

mysqli_close($conn);
?>
