<?php
require_once 'config.php';

$conn = mysqli_connect(db_host, db_user, db_password, db_name); //le variabili le ho definite su un altro file per motivi di sicurezza
if(!$conn)
    {
    die("CRITIC CONNECTION ERROR : ".mysqli_connect_error());
    }
mysqli_set_charset($conn, "utf8mb4");  //codifica corretta dei caratteri con accenti ecc. impazzisce seno
?>