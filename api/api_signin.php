<?php
require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');
$nickname = $_POST['nickname'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';



if(empty($nickname) || empty($email) || empty($password) )
    {
    echo json_encode(["status" => "error", "message" => "invalid camps"]);
    exit;    
    }

$res = registraGiocatore($conn, $nickname,$email, $password);

if ($res) {
    echo json_encode(["status" => "success", "message" => "Registrazione riuscita!"]);
} else {
    echo json_encode(["status" => "error", "message" => "Errore nel database (forse email già usata?)."]);
}
?>