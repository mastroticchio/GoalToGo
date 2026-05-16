<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require('giocatore');

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$prenotazioni = getPrenotazioniByGiocatore($conn, auth_id());

echo json_encode([
    'status'        => 'success',
    'prenotazioni'  => $prenotazioni,
]);

mysqli_close($conn);
?>
