<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require('giocatore');

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

$testo         = trim((string) ($data['testo'] ?? ''));
$orario        = trim((string) ($data['orario'] ?? ''));
$nome_campo    = trim((string) ($data['nome_campo'] ?? ''));
$max_giocatori = (int) ($data['max_giocatori'] ?? 10);

if ($testo === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Testo obbligatorio']);
    exit;
}

if (mb_strlen($testo) > 160) $testo = mb_substr($testo, 0, 160);
if ($orario !== '' && mb_strlen($orario) > 16) $orario = substr($orario, 0, 16);
if ($nome_campo !== '' && mb_strlen($nome_campo) > 80) $nome_campo = mb_substr($nome_campo, 0, 80);
if ($max_giocatori <= 0) $max_giocatori = 10;

$fk_giocatore = auth_id();

$profilo = getProfiloGiocatore($conn, $fk_giocatore);
if (!$profilo || empty($profilo['FK_CLUB'])) {
    echo json_encode(['status' => 'error', 'message' => 'Non sei in nessun club']);
    exit;
}

$fk_club = (int) $profilo['FK_CLUB'];

// se i campi opzionali sono vuoti li passiamo come null nel DB
$orarioVal     = $orario !== '' ? $orario : null;
$nomeCampoVal  = $nome_campo !== '' ? $nome_campo : null;

$id = creaProposta($conn, $fk_club, $fk_giocatore, $testo, $orarioVal, $nomeCampoVal, $max_giocatori);

if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'Errore creazione proposta: ' . mysqli_error($conn)]);
    exit;
}

echo json_encode(['status' => 'success', 'proposta_id' => $id]);

mysqli_close($conn);
?>
