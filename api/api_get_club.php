<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require();

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

// 3 modalità in base ai query param:
// ?id=<club_id>     -> singolo club
// ?nome=<search>    -> ricerca per nome (LIKE)
// (nessuno)         -> elenco di tutti i club

if (isset($_GET['id'])) {
    $id = (int) $_GET['id'];
    if ($id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'id non valido']);
        exit;
    }
    $club = getClubById($conn, $id);
    if (!$club) {
        echo json_encode(['status' => 'error', 'message' => 'Club non trovato']);
        exit;
    }
    echo json_encode(['status' => 'success', 'club' => $club]);
    exit;
}

if (isset($_GET['nome'])) {
    $nome = trim((string) $_GET['nome']);
    $clubs = getClubByName($conn, $nome);
    echo json_encode(['status' => 'success', 'clubs' => $clubs]);
    exit;
}

// default: elenco completo
$clubs = listAllClubs($conn);
echo json_encode(['status' => 'success', 'clubs' => $clubs]);

mysqli_close($conn);
?>
