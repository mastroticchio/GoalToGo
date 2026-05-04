<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once '../config/db_connection.php';

$data = json_decode(file_get_contents("php://input"), true);
$id_club = $data['id_club'] ?? null;

if (!$id_club) {
    echo json_encode(['status' => 'error', 'message' => 'ID club mancante']);
    exit;
}

$stmt = $conn->prepare("SELECT ID, NICKNAME FROM giocatore WHERE FK_CLUB = ?");
$stmt->bind_param("i", $id_club);
$stmt->execute();
$result = $stmt->get_result();

$membri = [];
while ($row = $result->fetch_assoc()) {
    $membri[] = $row;
}

echo json_encode(['status' => 'success', 'membri' => $membri]);

$conn->close();
?>