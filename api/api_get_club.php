<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once '../config/db_connection.php';

$data = json_decode(file_get_contents("php://input"), true);
$fk_giocatore = $data['fk_giocatore'] ?? null;

if (!$fk_giocatore) {
    echo json_encode(['status' => 'error', 'message' => 'ID giocatore mancante']);
    exit;
}

// Prende il club del giocatore
$stmt = $conn->prepare("
    SELECT c.*, 
           COUNT(g.ID) as membri_totali
    FROM club c
    LEFT JOIN giocatore g ON g.FK_CLUB = c.ID
    WHERE c.FK_GIOCATORE = ? OR c.ID = (SELECT FK_CLUB FROM giocatore WHERE ID = ?)
    GROUP BY c.ID
");
$stmt->bind_param("ii", $fk_giocatore, $fk_giocatore);
$stmt->execute();
$result = $stmt->get_result();
$club = $result->fetch_assoc();

if ($club) {
    echo json_encode(['status' => 'success', 'club' => $club]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Nessun club trovato']);
}

$conn->close();
?>