<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

// Accetta sia FormData (multipart) che JSON
$tipo     = $_POST['tipo']     ?? '';
$email    = trim($_POST['email']    ?? '');
$password = $_POST['password'] ?? '';
$nickname = trim($_POST['nickname'] ?? '');
$confirm  = $_POST['confirm']  ?? '';

// Fallback: se arriva come JSON
if ($tipo === '' && $email === '') {
    $raw  = file_get_contents('php://input');
    $json = json_decode($raw, true);
    if (is_array($json)) {
        $tipo     = $json['tipo']     ?? '';
        $email    = trim($json['email']    ?? '');
        $password = $json['password'] ?? '';
        $nickname = trim($json['nickname'] ?? '');
        $confirm  = $json['confirm']  ?? '';
    }
}

// Default tipo
if ($tipo === '') $tipo = 'giocatore';

// Validazione base
if ($email === '' || $password === '' || $nickname === '') {
    echo json_encode(['status' => 'error', 'message' => 'Tutti i campi sono obbligatori']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Email non valida']);
    exit;
}

if (strlen($password) < 4) {
    echo json_encode(['status' => 'error', 'message' => 'La password deve essere di almeno 4 caratteri']);
    exit;
}

if ($confirm !== '' && $confirm !== $password) {
    echo json_encode(['status' => 'error', 'message' => 'Le password non coincidono']);
    exit;
}

if (!in_array($tipo, ['giocatore', 'gestore'], true)) {
    echo json_encode(['status' => 'error', 'message' => 'Tipo utente non valido']);
    exit;
}

// Email già registrata?
if (getUtenteByEmail($conn, $email)) {
    echo json_encode(['status' => 'error', 'message' => 'Email già registrata']);
    exit;
}

// Registrazione
if ($tipo === 'gestore') {
    $ok = registraGestore($conn, $nickname, $email, $password);
} else {
    $ok = registraGiocatore($conn, $nickname, $email, $password);
}

if (!$ok) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Errore nel salvataggio. Riprova o controlla che il nickname non sia già in uso.',
        'detail'  => mysqli_error($conn)
    ]);
    exit;
}

// Auto-login post registrazione
$nuovo = getUtenteByEmail($conn, $email);
if ($nuovo) {
    $nome = $nuovo['TIPO'] === 'gestore'
        ? ($nuovo['NOME_CENTRO'] ?? '')
        : ($nuovo['NICKNAME']    ?? '');
    auth_login_user($nuovo['ID'], $nuovo['TIPO'], $nome);
    echo json_encode([
        'status'  => 'success',
        'message' => 'Registrazione riuscita!',
        'tipo'    => $nuovo['TIPO'],
        'id'      => $nuovo['ID'],
        'user'    => ['nickname' => $nome]
    ]);
} else {
    // Edge case: registrato ma non trovato (rarissimo)
    echo json_encode(['status' => 'success', 'message' => 'Registrazione riuscita! Accedi per continuare.']);
}

mysqli_close($conn);
?>
