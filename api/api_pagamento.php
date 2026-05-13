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

echo json_encode(['status' => 'success', 'message' => 'Pagamento confermato']);

mysqli_close($conn);
?>
