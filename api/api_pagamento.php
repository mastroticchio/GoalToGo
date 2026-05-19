<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require('giocatore');

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

$prenotazione_id = (int) ($data['prenotazione_id'] ?? 0);

if ($prenotazione_id <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'prenotazione_id mancante']);
    exit;
}

$ok = aggiornaStatoPrenotazione($conn, $prenotazione_id, 'paid');

if (!$ok) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Prenotazione non trovata o non tua']);
    exit;
}

// Recupera FK_CAMPO_ORARI dalla prenotazione appena pagata
// e segna lo slot come occupato (DISPONIBILE = 0)
$sqlOrario = "SELECT FK_CAMPO_ORARI FROM PRENOTAZIONE WHERE ID = ? AND FK_GIOCATORE = ?";
$stmt      = mysqli_prepare($conn, $sqlOrario);
mysqli_stmt_bind_param($stmt, 'ii', $prenotazione_id, auth_id());
mysqli_stmt_execute($stmt);
$row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));

if ($row && $row['FK_CAMPO_ORARI']) {
    $fkOrari = (int) $row['FK_CAMPO_ORARI'];
    $sqlUpd  = "UPDATE CAMPO_ORARI SET DISPONIBILE = 0 WHERE ID = ?";
    $stmtUpd = mysqli_prepare($conn, $sqlUpd);
    mysqli_stmt_bind_param($stmtUpd, 'i', $fkOrari);
    mysqli_stmt_execute($stmtUpd);
}

echo json_encode(['status' => 'success', 'message' => 'Pagamento confermato']);

mysqli_close($conn);
?>