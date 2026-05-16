<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require('giocatore');

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$fkGiocatore = auth_id();
$profilo     = getProfiloGiocatore($conn, $fkGiocatore);

if (!$profilo || empty($profilo['FK_CLUB'])) {
    echo json_encode(['status' => 'error', 'message' => 'Non sei in nessun club']);
    exit;
}

$fkClub = (int) $profilo['FK_CLUB'];

// Scadisci proposte vecchie
scadisciProposteOld($conn, $fkClub);

// Proposta attiva corrente (se esiste)
$attiva = getPropostaAttivaByClub($conn, $fkClub);

// Ultime proposte (storico + attiva)
$proposte = getProposteConAdesioni($conn, $fkClub, $fkGiocatore, 20);

echo json_encode([
    'status'          => 'success',
    'proposte'        => $proposte,
    'club_id'         => $fkClub,
    'proposta_attiva' => $attiva,  // null se nessuna attiva
]);

mysqli_close($conn);
?>
