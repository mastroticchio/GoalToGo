<?php
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../config/db_connection.php';

header('Content-Type: application/json');
auth_init();
auth_require(); // qualunque utente loggato puo' leggere la lista campi

$sql = "SELECT ID, NOME, INDIRIZZO, CITTA, PREZZO FROM CAMPO ORDER BY CITTA, NOME";
$result = mysqli_query($conn, $sql);
if (!$result) {
    echo json_encode(['status' => 'error', 'message' => 'Errore database']);
    exit;
}

$campi = [];
while ($row = mysqli_fetch_assoc($result)) {
    $campi[] = $row;
}

echo json_encode(['status' => 'success', 'campi' => $campi]);
?>
