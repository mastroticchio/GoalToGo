<?php
function registraGiocatore($conn, $nickname, $email, $password)   //funzione per registrare giocatori e trasferire i dati al db
    {
    $passwordSafe = password_hash($password, PASSWORD_DEFAULT); //cripto password
    $sql = "INSERT INTO GIOCATORE (NICKNAME, EMAIL, PWD) VALUES (?, ?, ?)"; //uso gli statment per motivi di sicurezza da capire se al prof possono dare fastidio in qualche modo 
    $stmt = mysqli_prepare($conn, $sql); // invio al db la struttura della query prima dei dati
    mysqli_stmt_bind_param($stmt, "sss", $nickname, $email, $passwordSafe); // invio i dati reali che interpreta come stringhe e non come possibili comandi mysqli
    return mysqli_stmt_execute($stmt);
    }
function getUtenteByEmail($conn, $email)    //funzione in fase di login per recuperare i dati in base all'email
    {
    $sql = "SELECT * FROM GIOCATORE WHERE EMAIL = ?";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "s",$email);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    return mysqli_fetch_assoc($result);    
    }
function getPartitaByName($conn, $nome)
    {
    
    //ciao
    }
function getPartitaById($conn, $nome)
    {


    }
function getClubByName($conn, $nome)
    {


    }
function getClubById($conn, $id)
    {


    }
function registraGestore($conn, $nome_centro, $email, $password)
    {
    $passwordSafe = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO GESTORE (NOME_CENTRO, EMAIL, PWD) VALUES (?, ?, ?)";
    $stmt = mysqli_prepare($conn, $sql);

    mysqli_stmt_bind_param($stmt, "sss", $nome_centro, $email, $passwordSafe);

    return mysqli_stmt_execute($stmt);
    }
?>