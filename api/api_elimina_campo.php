<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
$user = auth_require('gestore');

require_once __DIR__ . '/../config/db_connection.php';

header('Content-Type: application/json; charset=utf-8');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$idCampo = (int)($data['id'] ?? 0);
$idGestore = (int)$user['id'];

if ($idCampo <= 0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'ID campo non valido'
    ]);
    exit;
}

mysqli_begin_transaction($conn);

try {
    /*
      1. Controllo che il campo appartenga davvero al gestore loggato.
    */
    $sqlCheck = "
        SELECT ID
        FROM campo
        WHERE ID = ? AND FK_GESTORE = ?
        LIMIT 1
    ";

    $stmt = mysqli_prepare($conn, $sqlCheck);

    if (!$stmt) {
        throw new Exception('Errore preparazione controllo campo: ' . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($stmt, 'ii', $idCampo, $idGestore);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $campo = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if (!$campo) {
        mysqli_rollback($conn);
        echo json_encode([
            'status' => 'error',
            'message' => 'Campo non trovato o non autorizzato'
        ]);
        exit;
    }

    /*
      2. Elimino gli orari collegati al campo.
    */
    $sqlOrari = "
        DELETE FROM campo_orari
        WHERE CAMPO_ID = ?
    ";

    $stmt = mysqli_prepare($conn, $sqlOrari);

    if (!$stmt) {
        throw new Exception('Errore preparazione eliminazione orari: ' . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($stmt, 'i', $idCampo);
    mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    /*
      3. Elimino il campo.
    */
    $sqlCampo = "
        DELETE FROM campo
        WHERE ID = ? AND FK_GESTORE = ?
    ";

    $stmt = mysqli_prepare($conn, $sqlCampo);

    if (!$stmt) {
        throw new Exception('Errore preparazione eliminazione campo: ' . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($stmt, 'ii', $idCampo, $idGestore);
    mysqli_stmt_execute($stmt);

    $affected = mysqli_stmt_affected_rows($stmt);
    mysqli_stmt_close($stmt);

    if ($affected <= 0) {
        mysqli_rollback($conn);
        echo json_encode([
            'status' => 'error',
            'message' => 'Campo non eliminato'
        ]);
        exit;
    }

    mysqli_commit($conn);

    echo json_encode([
        'status' => 'success',
        'message' => 'Campo eliminato'
    ]);
    exit;

} catch (Throwable $e) {
    mysqli_rollback($conn);

    echo json_encode([
        'status' => 'error',
        'message' => 'Errore durante eliminazione campo',
        'detail' => $e->getMessage()
    ]);
    exit;
}
?>