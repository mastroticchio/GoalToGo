<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require();

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$club_id = isset($_GET['club_id']) ? (int) $_GET['club_id'] : 0;

// se non c'è club_id usiamo il club della sessione (solo per giocatori)
if ($club_id <= 0) {
    $u = auth_user();
    if ($u && $u['tipo'] === 'giocatore') {
        $profilo = getProfiloGiocatore($conn, auth_id());
        if ($profilo && !empty($profilo['FK_CLUB'])) {
            $club_id = (int) $profilo['FK_CLUB'];
        }
    }
}

if ($club_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'club_id mancante']);
    exit;
}

$proposte = getProposteByClub($conn, $club_id, 20);

echo json_encode(['status' => 'success', 'proposte' => $proposte]);

mysqli_close($conn);
?>
