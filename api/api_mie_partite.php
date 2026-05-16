<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require('giocatore');

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$partite = getPartiteIscritto($conn, auth_id());

echo json_encode([
    'status'  => 'success',
    'partite' => $partite,
]);

mysqli_close($conn);
?>
