<?php
function registraGiocatore($conn, $nickname, $email, $password)   //funzione per registrare giocatori e trasferire i dati al db
    {
    $passwordSafe = password_hash($password, PASSWORD_DEFAULT); //cripto password
    $sql = "INSERT INTO GIOCATORE (NICKNAME, EMAIL, PWD) VALUES (?, ?, ?)"; //uso gli statment per motivi di sicurezza da capire se al prof possono dare fastidio in qualche modo 
    $stmt = mysqli_prepare($conn, $sql); // invio al db la struttura della query prima dei dati
    mysqli_stmt_bind_param($stmt, "sss", $nickname, $email, $passwordSafe); // invio i dati reali che interpreta come stringhe e non come possibili comandi mysqli
    return mysqli_stmt_execute($stmt);
    }
function getUtenteByEmail($conn, $email)
{
    $sql1 = "SELECT NICKNAME, EMAIL, PWD FROM GIOCATORE WHERE EMAIL = ?";
    $stmt1 = mysqli_prepare($conn, $sql1);
    mysqli_stmt_bind_param($stmt1, "s", $email);
    mysqli_stmt_execute($stmt1);
    $result1 = mysqli_stmt_get_result($stmt1);

    if ($row = mysqli_fetch_assoc($result1)) {
        $row['TIPO'] = 'giocatore';
        return $row;
    }

    $sql2 = "SELECT NOME_CENTRO, EMAIL, PWD FROM GESTORE WHERE EMAIL = ?";
    $stmt2 = mysqli_prepare($conn, $sql2);
    mysqli_stmt_bind_param($stmt2, "s", $email);
    mysqli_stmt_execute($stmt2);
    $result2 = mysqli_stmt_get_result($stmt2);

    if ($row = mysqli_fetch_assoc($result2)) {
        $row['TIPO'] = 'gestore';
        return $row;
    }

    return null;
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