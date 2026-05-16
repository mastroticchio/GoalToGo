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

$testo        = trim((string) ($data['testo']         ?? ''));
$orario       = trim((string) ($data['orario']        ?? ''));
$dataPartita  = trim((string) ($data['data']          ?? ''));
$nomeCampo    = trim((string) ($data['nome_campo']    ?? ''));
$maxGiocatori = (int)         ($data['max_giocatori'] ?? 10);

if ($testo === '') $testo = 'Partita proposta';

$fkGiocatore = auth_id();
$profilo     = getProfiloGiocatore($conn, $fkGiocatore);

if (!$profilo || empty($profilo['FK_CLUB'])) {
    echo json_encode(['status' => 'error', 'message' => 'Non sei in nessun club']);
    exit;
}

$fkClub = (int) $profilo['FK_CLUB'];

// Scadisci proposte vecchie prima di tutto
scadisciProposteOld($conn, $fkClub);

// Blocco: esiste già una proposta attiva per questo club?
$propAttiva = getPropostaAttivaByClub($conn, $fkClub);
if ($propAttiva) {
    $secRim = max(0, 1800 - (int) $propAttiva['SECONDI_PASSATI']);
    $min    = (int) ceil($secRim / 60);
    echo json_encode([
        'status'             => 'error',
        'message'            => "C'è già una proposta attiva. Potrai proporne un'altra tra {$min} minuto/i.",
        'proposta_attiva_id' => (int) $propAttiva['ID'],
        'secondi_rimanenti'  => $secRim,
    ]);
    exit;
}

if (mb_strlen($testo) > 160) $testo = mb_substr($testo, 0, 160);
if ($orario    !== '' && mb_strlen($orario)    > 16) $orario    = substr($orario, 0, 16);
if ($nomeCampo !== '' && mb_strlen($nomeCampo) > 80) $nomeCampo = mb_substr($nomeCampo, 0, 80);
if ($maxGiocatori <= 0) $maxGiocatori = 10;

$orarioVal    = $orario      !== '' ? $orario      : null;
$dataVal      = $dataPartita !== '' ? $dataPartita : null;
$nomeCampoVal = $nomeCampo   !== '' ? $nomeCampo   : null;

$id = creaPropostaCompleta($conn, $fkClub, $fkGiocatore, $testo, $orarioVal, $dataVal, $nomeCampoVal, $maxGiocatori);

if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'Errore DB: ' . mysqli_error($conn)]);
    exit;
}

echo json_encode(['status' => 'success', 'proposta_id' => $id]);
mysqli_close($conn);
?>
