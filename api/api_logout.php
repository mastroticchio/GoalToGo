<?php
// endpoint POST per chiudere la sessione utente
require_once __DIR__ . '/../lib/auth.php';
header('Content-Type: application/json');
auth_init();
auth_logout();
echo json_encode(['status' => 'success', 'message' => 'Disconnesso']);
?>
