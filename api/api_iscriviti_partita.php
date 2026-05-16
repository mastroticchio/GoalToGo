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
$squadra    = strtoupper(trim((string) ($data['squadra'] ?? 'A')));
if ($squadra !== 'A' && $squadra !== 'B') $squadra = 'A';

if ($fk_partita <= 0) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'fk_partita mancante']);
    exit;
}

$res = iscriviGiocatoreAPartita($conn, auth_id(), $fk_partita, $squadra);

if (!$res['ok']) {
    echo json_encode(['status' => 'error', 'message' => $res['message']]);
    exit;
}

echo json_encode([
    'status'  => 'success',
    'message' => $res['message'],
    'squadra' => $res['squadra'],
]);

mysqli_close($conn);
?>
