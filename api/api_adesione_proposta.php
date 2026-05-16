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

$fkProposta = (int)    ($data['proposta_id'] ?? 0);
$azione     = trim((string) ($data['azione'] ?? ''));

if ($fkProposta <= 0 || !in_array($azione, ['accetta', 'rifiuta'], true)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Parametri non validi']);
    exit;
}

$fkGiocatore = auth_id();
$profilo     = getProfiloGiocatore($conn, $fkGiocatore);

if (!$profilo || empty($profilo['FK_CLUB'])) {
    echo json_encode(['status' => 'error', 'message' => 'Non sei in nessun club']);
    exit;
}

// Verifica che la proposta appartenga al club del giocatore
$sqlCheck = "SELECT FK_CLUB, STATO FROM PROPOSTA WHERE ID = ?";
$stmtC    = mysqli_prepare($conn, $sqlCheck);
mysqli_stmt_bind_param($stmtC, "i", $fkProposta);
mysqli_stmt_execute($stmtC);
$row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtC));

if (!$row || (int) $row['FK_CLUB'] !== (int) $profilo['FK_CLUB']) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Proposta non trovata nel tuo club']);
    exit;
}

if ($row['STATO'] !== 'attiva') {
    echo json_encode(['status' => 'error', 'message' => 'Questa proposta non è più attiva']);
    exit;
}

if ($azione === 'accetta') {
    $result = aggiungiAdesioneProposta($conn, $fkProposta, $fkGiocatore);

    if (!$result['ok']) {
        echo json_encode(['status' => 'error', 'message' => $result['message']]);
        exit;
    }

    echo json_encode([
        'status'       => 'success',
        'num_adesioni' => $result['num_adesioni'],
        'confermata'   => $result['confermata'],
    ]);
} else {
    $ok = rimuoviAdesioneProposta($conn, $fkProposta, $fkGiocatore);
    echo json_encode(['status' => $ok ? 'success' : 'error']);
}

mysqli_close($conn);
?>
