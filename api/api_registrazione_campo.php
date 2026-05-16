<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require('gestore');

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "status" => "error",
        "message" => "Dati non validi"
    ]);
    exit;
}

$nome = $data['nome'] ?? '';
$indirizzo = $data['indirizzo'] ?? '';
$citta = $data['citta'] ?? '';
$prezzo = $data['prezzo'] ?? '';
// fk_gestore preso dalla sessione, non dal client
$fk_gestore = auth_id();
$orari = $data['orari'] ?? [];

if (!$nome || !$indirizzo || !$citta || !$prezzo) {
    echo json_encode([
        "status" => "error",
        "message" => "Campi obbligatori mancanti"
    ]);
    exit;
}

$campo_id = registraCampo(
    $conn,
    $nome,
    $indirizzo,
    $citta,
    $prezzo,
    $fk_gestore,
    $orari
);

if ($campo_id) {
    echo json_encode([
        "status" => "success",
        "message" => "Campo registrato con successo",
        "campo_id" => $campo_id
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Errore nella registrazione del campo"
    ]);
}