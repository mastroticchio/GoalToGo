<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require('giocatore');

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$ok = abbandonaClub($conn, auth_id());
if (!$ok) {
    echo json_encode(['status' => 'error', 'message' => 'Errore: ' . mysqli_error($conn)]);
    exit;
}
echo json_encode(['status' => 'success', 'message' => 'Hai lasciato il club']);
mysqli_close($conn);
?>
