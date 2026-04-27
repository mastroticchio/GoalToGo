<?php
require_once 'C:/xampp/htdocs/goaltogo/config/db_connection.php';
require_once 'C:/xampp/htdocs/goaltogo/lib/functions_users.php';

header('Content-Type: application/json');
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if(empty($email) || empty($password))
    {
    echo json_encode(["status" => "error", "message" => "invalid camp"]);
    exit;    
    }
$res = getUtenteByEmail($conn, $email);

if($res)
    {
    if(password_verify($password, $res['PWD']))
        {
        echo json_encode([
            "status" => "success",
            "message" => "Login effettuato",
            "user" => ["nickname" => $res['NICKNAME']]
            ]);
  
        }
    else   
        {
        echo json_encode(["status" =>  "error", "message" =>"Password errata"]);    
        }
    }
else
    {
    echo json_encode(["status" => "error", "message" => "email not found"]);    
    }
?>