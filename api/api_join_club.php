<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require('giocatore');

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) $data = $_POST;

$id_club = (int) ($data['id_club'] ?? 0);
if ($id_club <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'id_club mancante']);
    exit;
}

$res = iscriviGiocatoreAClub($conn, auth_id(), $id_club);
if (!$res['ok']) {
    echo json_encode(['status' => 'error', 'message' => $res['message']]);
    exit;
}

echo json_encode(['status' => 'success', 'message' => 'Iscritto al club', 'id_club' => $id_club]);
mysqli_close($conn);
?>
