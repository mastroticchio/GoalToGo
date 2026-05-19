<?php
require_once '../config/db_connection.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['orari']) || !is_array($data['orari'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Dati non validi'
    ]);
    exit;
}

$errori = 0;

foreach ($data['orari'] as $orario) {
    $id          = (int) ($orario['id'] ?? 0);
    $disponibile = $orario['disponibile'] ? 1 : 0;

    if (!$id) {
        $errori++;
        continue;
    }

    $sql  = "UPDATE CAMPO_ORARI SET DISPONIBILE = ? WHERE ID = ?";
    $stmt = mysqli_prepare($conn, $sql);

    if (!$stmt) {
        $errori++;
        continue;
    }

    mysqli_stmt_bind_param($stmt, 'ii', $disponibile, $id);

    if (!mysqli_stmt_execute($stmt)) {
        $errori++;
    }
}

if ($errori > 0) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Alcuni orari non sono stati aggiornati'
    ]);
} else {
    echo json_encode([
        'status'  => 'success',
        'message' => 'Disponibilità aggiornata'
    ]);
}