<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
$me = auth_require(); // qualunque utente loggato

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$id   = auth_id();
$tipo = $me['tipo'];

// GET: lettura profilo (dispatch su tipo utente)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($tipo === 'gestore') {
        $profilo = getProfiloGestore($conn, $id);
        if (!$profilo) {
            echo json_encode(['status' => 'error', 'message' => 'Profilo non trovato']);
            exit;
        }
        echo json_encode([
            'status'  => 'success',
            'tipo'    => 'gestore',
            'profilo' => [
                'id'          => (int) $profilo['ID'],
                'nome_centro' => $profilo['NOME_CENTRO'],
                'nickname'    => $profilo['NOME_CENTRO'],
                'email'       => $profilo['EMAIL'],
            ],
        ]);
        exit;
    }

    // giocatore
    $profilo = getProfiloGiocatore($conn, $id);
    if (!$profilo) {
        echo json_encode(['status' => 'error', 'message' => 'Profilo non trovato']);
        exit;
    }
    $club_nome = null;
    if (!empty($profilo['FK_CLUB'])) {
        $club = getClubById($conn, (int) $profilo['FK_CLUB']);
        if ($club) $club_nome = $club['NOME'];
    }
    echo json_encode([
        'status'  => 'success',
        'tipo'    => 'giocatore',
        'profilo' => [
            'id'        => (int) $profilo['ID'],
            'nickname'  => $profilo['NICKNAME'],
            'email'     => $profilo['EMAIL'],
            'fk_club'   => $profilo['FK_CLUB'] !== null ? (int) $profilo['FK_CLUB'] : null,
            'club_nome' => $club_nome,
        ],
    ]);
    exit;
}

// POST: aggiornamento profilo
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

// accettiamo sia "nickname" sia "nome_centro" come alias del nome visibile
$nome  = trim((string) ($data['nickname'] ?? $data['nome_centro'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));

if ($nome === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Nome e email obbligatori']);
    exit;
}
if (mb_strlen($nome) > 80) {
    echo json_encode(['status' => 'error', 'message' => 'Nome troppo lungo']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Email non valida']);
    exit;
}

if ($tipo === 'gestore') {
    $ok = aggiornaProfiloGestore($conn, $id, $nome, $email);
} else {
    $ok = aggiornaProfiloGiocatore($conn, $id, $nome, $email);
}

if (!$ok) {
    echo json_encode(['status' => 'error', 'message' => 'Errore aggiornamento: ' . mysqli_error($conn)]);
    exit;
}

// sync sessione
$_SESSION['nomeUtente'] = $nome;

echo json_encode(['status' => 'success', 'message' => 'Aggiornato']);

mysqli_close($conn);
?>
