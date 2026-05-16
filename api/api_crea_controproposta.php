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

$fkPadre       = (int)    ($data['proposta_padre_id'] ?? 0);
$testo         = trim((string) ($data['testo']         ?? ''));
$orario        = trim((string) ($data['orario']        ?? ''));
$dataPartita   = trim((string) ($data['data']          ?? ''));
$nomeCampo     = trim((string) ($data['nome_campo']    ?? ''));
$maxGiocatori  = (int)    ($data['max_giocatori']      ?? 10);

if ($fkPadre <= 0 || $testo === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Dati mancanti']);
    exit;
}

$fkGiocatore = auth_id();
$profilo     = getProfiloGiocatore($conn, $fkGiocatore);

if (!$profilo || empty($profilo['FK_CLUB'])) {
    echo json_encode(['status' => 'error', 'message' => 'Non sei in nessun club']);
    exit;
}

$fkClub = (int) $profilo['FK_CLUB'];

// Verifica che la proposta padre appartenga allo stesso club E sia scaduta/attiva
$sqlP = "SELECT FK_CLUB, STATO,
                GREATEST(0, 1800 - TIMESTAMPDIFF(SECOND, CREATED_AT, NOW())) AS SECONDI
         FROM PROPOSTA WHERE ID = ?";
$stmtP = mysqli_prepare($conn, $sqlP);
mysqli_stmt_bind_param($stmtP, "i", $fkPadre);
mysqli_stmt_execute($stmtP);
$padre = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtP));

if (!$padre || (int) $padre['FK_CLUB'] !== $fkClub) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Proposta padre non valida']);
    exit;
}

// La controproposta è permessa solo se la proposta padre è scaduta (> 30 min)
// oppure se la proposta padre è ancora attiva ma il giocatore è l'autore
if ((int) $padre['SECONDI'] > 0 && $padre['STATO'] !== 'confermata') {
    // Controlla se è l'autore della proposta padre
    $sqlAutore = "SELECT FK_GIOCATORE FROM PROPOSTA WHERE ID = ?";
    $stmtA     = mysqli_prepare($conn, $sqlAutore);
    mysqli_stmt_bind_param($stmtA, "i", $fkPadre);
    mysqli_stmt_execute($stmtA);
    $autore = mysqli_fetch_assoc(mysqli_stmt_get_result($stmtA));
    if (!$autore || (int) $autore['FK_GIOCATORE'] !== $fkGiocatore) {
        echo json_encode([
            'status'  => 'error',
            'message' => 'Puoi fare una controproposta solo dopo 30 minuti dalla proposta originale',
        ]);
        exit;
    }
}

// Sanifica
if (mb_strlen($testo) > 160) $testo = mb_substr($testo, 0, 160);
if ($orario !== '' && mb_strlen($orario) > 16) $orario = substr($orario, 0, 16);
if ($nomeCampo !== '' && mb_strlen($nomeCampo) > 80) $nomeCampo = mb_substr($nomeCampo, 0, 80);
if ($maxGiocatori <= 0) $maxGiocatori = 10;
$orarioVal    = $orario       !== '' ? $orario     : null;
$dataVal      = $dataPartita  !== '' ? $dataPartita: null;
$nomeCampoVal = $nomeCampo    !== '' ? $nomeCampo  : null;

$id = creaControproposta($conn, $fkClub, $fkGiocatore, $testo, $orarioVal, $dataVal, $nomeCampoVal, $maxGiocatori, $fkPadre);

if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'Errore creazione controproposta: ' . mysqli_error($conn)]);
    exit;
}

echo json_encode(['status' => 'success', 'proposta_id' => $id]);

mysqli_close($conn);
?>
