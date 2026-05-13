<?php
// ritorna l'utente corrente in sessione, oppure 401 se non loggato
require_once __DIR__ . '/../lib/auth.php';
header('Content-Type: application/json');
auth_init();
$u = auth_user();
if (!$u) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Non autenticato']);
    exit;
}
echo json_encode([
    'status' => 'success',
    'user'   => $u,
    'tipo'   => $u['tipo'],
    'id'     => $u['id'],
]);
?>
