<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
$user = auth_require('gestore');

require_once __DIR__ . '/../config/db_connection.php';

header('Content-Type: application/json; charset=utf-8');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$idCampo = (int)($data['id'] ?? 0);
$nome = trim($data['nome'] ?? '');
$indirizzo = trim($data['indirizzo'] ?? '');
$citta = trim($data['citta'] ?? '');
$prezzo = $data['prezzo'] ?? null;

$idGestore = (int)$user['id'];

if ($idCampo <= 0 || $nome === '' || $indirizzo === '' || $citta === '' || $prezzo === null) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Dati mancanti'
    ]);
    exit;
}

$prezzo = (float)$prezzo;

if ($prezzo < 0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Prezzo non valido'
    ]);
    exit;
}

$sql = "
    UPDATE campo
    SET NOME = ?, INDIRIZZO = ?, CITTA = ?, PREZZO = ?
    WHERE ID = ? AND FK_GESTORE = ?
";

$stmt = mysqli_prepare($conn, $sql);

if (!$stmt) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Errore preparazione query',
        'detail' => mysqli_error($conn)
    ]);
    exit;
}

mysqli_stmt_bind_param(
    $stmt,
    'sssdii',
    $nome,
    $indirizzo,
    $citta,
    $prezzo,
    $idCampo,
    $idGestore
);

if (!mysqli_stmt_execute($stmt)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Errore aggiornamento campo',
        'detail' => mysqli_error($conn)
    ]);
    exit;
}

mysqli_stmt_close($stmt);

echo json_encode([
    'status' => 'success',
    'message' => 'Campo aggiornato'
]);
exit;
?>