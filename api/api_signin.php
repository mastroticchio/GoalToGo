<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$tipo     = $_POST['tipo']     ?? 'giocatore';
$email    = $_POST['email']    ?? '';
$password = $_POST['password'] ?? '';
$nickname = $_POST['nickname'] ?? '';        // usato sia per giocatore.NICKNAME che per gestore.NOME_CENTRO

if ($email === '' || $password === '' || $nickname === '') {
    echo json_encode(["status" => "error", "message" => "Campi mancanti"]);
    exit;
}

if (!in_array($tipo, ['giocatore', 'gestore'], true)) {
    echo json_encode(["status" => "error", "message" => "Tipo utente non valido"]);
    exit;
}

// Email gia' presente? Controlliamo entrambe le tabelle: una persona = un'identita'.
if (getUtenteByEmail($conn, $email)) {
    echo json_encode(["status" => "error", "message" => "Email gia' registrata"]);
    exit;
}

if ($tipo === 'gestore') {
    $ok = registraGestore($conn, $nickname, $email, $password);
} else {
    $ok = registraGiocatore($conn, $nickname, $email, $password);
}

if (!$ok) {
    echo json_encode(["status" => "error", "message" => "Errore nel database"]);
    exit;
}

// auto-login post registrazione
$nuovo = getUtenteByEmail($conn, $email);
if ($nuovo) {
    $nome = $nuovo['TIPO'] === 'gestore' ? ($nuovo['NOME_CENTRO'] ?? '') : ($nuovo['NICKNAME'] ?? '');
    auth_login_user($nuovo['ID'], $nuovo['TIPO'], $nome);
    echo json_encode([
        "status"  => "success",
        "message" => "Registrazione riuscita!",
        "tipo"    => $nuovo['TIPO'],
        "id"      => $nuovo['ID'],
        "user"    => [
            "nickname" => $nome
        ]
    ]);
} else {
    echo json_encode(["status" => "success", "message" => "Registrazione riuscita!"]);
}
?>
