<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require();

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

// accetta club_id da query string oppure id_club da body JSON (legacy)
$club_id = 0;
if (isset($_GET['club_id'])) {
    $club_id = (int) $_GET['club_id'];
} else {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (is_array($data)) {
        if (isset($data['club_id'])) $club_id = (int) $data['club_id'];
        elseif (isset($data['id_club'])) $club_id = (int) $data['id_club'];
    }
}

if ($club_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'club_id mancante']);
    exit;
}

$membri = getMembriByClub($conn, $club_id);

echo json_encode(['status' => 'success', 'membri' => $membri]);

mysqli_close($conn);
?>
