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
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once '../config/db_connection.php';

$data = json_decode(file_get_contents("php://input"), true);

$nome = $data['nome'] ?? '';
$descrizione = $data['descrizione'] ?? '';
$visibilita = $data['visibilita'] ?? 'pubblico';
$n_componenti = (int) ($data['n_componenti'] ?? 2);
// fk_giocatore preso dalla sessione, non dal client
$fk_giocatore = auth_id();

if (!$nome) {
    echo json_encode(['status' => 'error', 'message' => 'Dati mancanti']);
    exit;
}

// Vincolo di prodotto: 2 <= n_componenti <= 40
if ($n_componenti < 2)  { $n_componenti = 2; }
if ($n_componenti > 40) { $n_componenti = 40; }

$stmt = $conn->prepare("INSERT INTO club (NOME, DESCRIZIONE, VISIBILITA, N_COMPONENTI, FK_GIOCATORE) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssii", $nome, $descrizione, $visibilita, $n_componenti, $fk_giocatore);

if ($stmt->execute()) {
    $id_club = $conn->insert_id;

    // Aggiorna FK_CLUB del giocatore
    $stmt2 = $conn->prepare("UPDATE giocatore SET FK_CLUB = ? WHERE ID = ?");
    $stmt2->bind_param("ii", $id_club, $fk_giocatore);
    $stmt2->execute();

    echo json_encode(['status' => 'success', 'message' => 'Club creato!', 'id_club' => $id_club]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Errore nella creazione del club']);
}

$conn->close();
?>