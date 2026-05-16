<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require();

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'id mancante']);
    exit;
}

$partita = getPartitaById($conn, $id);

if (!$partita) {
    echo json_encode(['status' => 'error', 'message' => 'Partita non trovata']);
    exit;
}

$teams = getTeamsByPartita($conn, $id);
$max = (int) ($partita['MAX_GIOCATORI'] ?? 10);

echo json_encode([
    'status'        => 'success',
    'partita'       => $partita,
    'max_giocatori' => $max,
    'max_per_squadra' => (int) ($max / 2),
    'stato'         => $partita['STATO'] ?? 'in_attesa',
    'teamA'         => $teams['A'],
    'teamB'         => $teams['B'],
    'sono_iscritto' => (function () use ($teams) {
        $me = auth_id();
        foreach ($teams['A'] as $g) if ($g['id'] === $me) return 'A';
        foreach ($teams['B'] as $g) if ($g['id'] === $me) return 'B';
        return null;
    })(),
]);

mysqli_close($conn);
?>
