<?php
require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode([
        "status" => "error",
        "message" => "Campi mancanti"
    ]);
    exit;    
}

$res = getUtenteByEmail($conn, $email);

if ($res) {

    if (password_verify($password, $res['PWD'])) {

        if ($res['TIPO'] === 'gestore') {
            $nome = $res['NOME_CENTRO'];
        } else {
            $nome = $res['NICKNAME'];
        }

        echo json_encode([
            "status" => "success",
            "message" => "Login effettuato",
            "tipo" => $res['TIPO'],
            "id" => $res['ID'],
            "user" => [
                "nickname" => $nome
            ]
        ]);

    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Password errata"
        ]);
    }

} else {
    echo json_encode([
        "status" => "error",
        "message" => "Email non trovata"
    ]);
}
?>