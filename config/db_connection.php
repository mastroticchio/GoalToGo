<?php
require_once 'config.php';

$conn = mysqli_connect(db_host, db_user, db_password, db_name);

if (!$conn) {
    // Risponde sempre JSON — mai HTML grezzo — così il front-end capisce l'errore
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Errore connessione al database. Controlla che MySQL sia attivo e che il DB "goaltogo" esista.',
        'detail'  => mysqli_connect_error()
    ]);
    exit;
}

mysqli_set_charset($conn, 'utf8mb4');
?>
