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

$fk_campo_orari = (int) ($data['fk_campo_orari'] ?? 0);
$orario         = trim((string) ($data['orario'] ?? ''));
$prezzo         = (float) ($data['prezzo'] ?? 0);
$num_giocatori  = (int) ($data['num_giocatori'] ?? 0);

if ($fk_campo_orari <= 0 || $orario === '' || $num_giocatori <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Campi obbligatori mancanti']);
    exit;
}

if (mb_strlen($orario) > 16) $orario = substr($orario, 0, 16);

// Vincolo: si prenota SOLO per il giorno corrente (uso giornaliero).
$today = date('Y-m-d');
if (strpos($orario, $today) !== 0) {
    // Se il client ha mandato solo "HH:MM" o "HH:MM:SS", anteponiamo la data di oggi.
    // Altrimenti rifiutiamo: orario per giorni diversi non e' supportato.
    if (preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $orario)) {
        $orario = $today . 'T' . substr($orario, 0, 5);
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Si prenota solo per oggi.']);
        exit;
    }
}

$fk_giocatore = auth_id();

$id = creaPrenotazione($conn, $fk_giocatore, $fk_campo_orari, $orario, $prezzo, $num_giocatori, 'pending');

if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'Errore nella prenotazione: ' . mysqli_error($conn)]);
    exit;
}

echo json_encode([
    'status'          => 'success',
    'prenotazione_id' => $id,
    'prenotazione'    => [
        'id'             => $id,
        'status'         => 'pending',
        'orario'         => $orario,
        'fk_campo_orari' => $fk_campo_orari,
        'fk_giocatore'   => $fk_giocatore,
        'prezzo'         => $prezzo,
        'num_giocatori'  => $num_giocatori,
    ],
]);

mysqli_close($conn);
?>
