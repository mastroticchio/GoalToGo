<?php
// Helper centrale per autenticazione via sessioni PHP.
// Tutti gli endpoint protetti devono fare:
//   require_once __DIR__ . '/../lib/auth.php';
//   auth_init();
//   auth_require('giocatore');  // o 'gestore' o nessun argomento (any)
//   $userId = auth_id();

function auth_init() {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure'   => false, // metti true se servi su HTTPS
    ]);
    session_start();
}

function auth_login_user($id, $tipo, $nome) {
    session_regenerate_id(true);
    $_SESSION['idUtente']   = (int) $id;
    $_SESSION['tipoUtente'] = $tipo;
    $_SESSION['nomeUtente'] = $nome;
}

function auth_logout() {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $p["path"], $p["domain"], $p["secure"], $p["httponly"]);
    }
    session_destroy();    
}

function auth_user() {
    if (!isset($_SESSION['idUtente'])) return null;
    return [
        'id'   => $_SESSION['idUtente'],
        'tipo' => $_SESSION['tipoUtente'] ?? null,
        'nome' => $_SESSION['nomeUtente'] ?? '',
    ];
}

function auth_id() {
    return (int) ($_SESSION['idUtente'] ?? 0);
}

function auth_require($tipo = null) {
    $u = auth_user();
    if (!$u) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Non autenticato']);
        exit;
    }
    if ($tipo !== null && $u['tipo'] !== $tipo) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Permesso negato']);
        exit;
    }
    return $u;
}
?>
