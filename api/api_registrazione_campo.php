<?php

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php'; 
// (qui dentro hai registraCampo e inserisciOrarioCampo)

header('Content-Type: application/json');

// =========================
// 1. LEGGO JSON DAL FRONTEND
// =========================
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "status" => "error",
        "message" => "Dati non validi"
    ]);
    exit;
}

// =========================
// 2. ESTRAZIONE DATI
// =========================
$nome = $data['nome'] ?? '';
$indirizzo = $data['indirizzo'] ?? '';
$citta = $data['citta'] ?? '';
$prezzo = $data['prezzo'] ?? '';
$fk_gestore = $data['fk_gestore'] ?? '';
$orari = $data['orari'] ?? [];

// =========================
// 3. VALIDAZIONE BASE
// =========================
if (!$nome || !$indirizzo || !$citta || !$prezzo || !$fk_gestore) {
    echo json_encode([
        "status" => "error",
        "message" => "Campi obbligatori mancanti"
    ]);
    exit;
}

// =========================
// 4. CHIAMO LA FUNZIONE PRINCIPALE
// =========================
$campo_id = registraCampo(
    $conn,
    $nome,
    $indirizzo,
    $citta,
    $prezzo,
    $fk_gestore,
    $orari
);

// =========================
// 5. RISPOSTA
// =========================
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