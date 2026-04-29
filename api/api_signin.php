<?php
require_once '../config/db_connection.php';
require_once '../lib/functions_campo.php';

header('Content-Type: application/json');

$nome = $_POST['nome'] ?? '';
$indirizzo = $_POST['indirizzo'] ?? '';
$citta = $_POST['citta'] ?? '';
$prezzo = $_POST['prezzo'] ?? '';
$fk_gestore = $_POST['fk_gestore'] ?? '';
$orari = $_POST['orari'] ?? '';

if (
    empty($nome) ||
    empty($indirizzo) ||
    empty($citta) ||
    empty($prezzo) ||
    empty($fk_gestore)
) {
    echo json_encode([
        "status" => "error",
        "message" => "Campi mancanti"
    ]);
    exit;
}

$orariArray = json_decode($orari, true);

if (!$orariArray) {
    $orariArray = [];
}

$res = registraCampo(
    $conn,
    $nome,
    $indirizzo,
    $citta,
    $prezzo,
    $fk_gestore,
    $orariArray
);

if ($res) {
    echo json_encode([
        "status" => "success",
        "message" => "Campo registrato con successo"
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Errore nel database"
    ]);
}
?>