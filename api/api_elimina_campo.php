<?php
require_once '../config/db_connection.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['id'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'ID mancante'
    ]);
    exit;
}

$id = (int) $data['id'];

// prima elimina gli orari associati (foreign key)
$sql = "DELETE FROM CAMPO_ORARI WHERE CAMPO_ID = ?";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, 'i', $id);
mysqli_stmt_execute($stmt);

// poi elimina il campo
$sql = "DELETE FROM CAMPO WHERE ID = ?";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, 'i', $id);
$ok = mysqli_stmt_execute($stmt);

if ($ok && mysqli_affected_rows($conn) > 0) {
    echo json_encode([
        'status'  => 'success',
        'message' => 'Campo eliminato'
    ]);
} else {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Campo non trovato o già eliminato'
    ]);
}