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

$fk_partita = (int) ($data['fk_partita'] ?? 0);

if ($fk_partita <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'fk_partita mancante']);
    exit;
}

$ok = rimuoviGiocatoreDaPartita($conn, auth_id(), $fk_partita);

if (!$ok) {
    echo json_encode(['status' => 'error', 'message' => 'Errore disiscrizione: ' . mysqli_error($conn)]);
    exit;
}

// ricalcolo stato (potrebbe tornare a 'in_attesa' da 'confermata')
aggiornaStatoPartita($conn, $fk_partita);

echo json_encode(['status' => 'success']);

mysqli_close($conn);
?>
