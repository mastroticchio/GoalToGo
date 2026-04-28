<?php
require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$nickname = $_POST['nickname'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';
$tipo = $_POST['tipo'] ?? ''; // 🔥 NUOVO

// controllo campi
if (empty($nickname) || empty($email) || empty($password) || empty($tipo)) {
    echo json_encode([
        "status" => "error",
        "message" => "Campi mancanti"
    ]);
    exit;
}

if ($tipo === 'giocatore') {

    $res = registraGiocatore($conn, $nickname, $email, $password);

} elseif ($tipo === 'gestore') {

    $res = registraGestore($conn, $nickname, $email, $password);

} else {
    echo json_encode([
        "status" => "error",
        "message" => "Tipo utente non valido"
    ]);
    exit;
}

// risposta finale
if ($res) {
    echo json_encode([
        "status" => "success",
        "message" => "Registrazione riuscita!",
        "tipo" => $tipo // 🔥 serve per redirect JS
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Errore nel database (forse email già usata?)"
    ]);
}
?>