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
    // GIOCATORE
    $sql1 = "SELECT ID, NICKNAME, EMAIL, PWD FROM GIOCATORE WHERE EMAIL = ?";
    $stmt1 = mysqli_prepare($conn, $sql1);
    mysqli_stmt_bind_param($stmt1, "s", $email);
    mysqli_stmt_execute($stmt1);
    $result1 = mysqli_stmt_get_result($stmt1);

    if ($row = mysqli_fetch_assoc($result1)) {
        $row['TIPO'] = 'giocatore';
        return $row;
    }

    // GESTORE
    $sql2 = "SELECT ID, NOME_CENTRO, EMAIL, PWD FROM GESTORE WHERE EMAIL = ?";
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
function registraCampo($conn, $nome, $indirizzo, $citta, $prezzo, $fk_gestore, $orari)
    {
    $sql = "INSERT INTO CAMPO (NOME, INDIRIZZO, CITTA, PREZZO, FK_GESTORE)
            VALUES (?, ?, ?, ?, ?)";

    $stmt = mysqli_prepare($conn, $sql);

    mysqli_stmt_bind_param($stmt, "sssdi",
        $nome,
        $indirizzo,
        $citta,
        $prezzo,
        $fk_gestore
    );

    $ok = mysqli_stmt_execute($stmt);

    if (!$ok) {
        return false;
    }

    $campo_id = mysqli_insert_id($conn);

    if (!$orari || !is_array($orari)) {
        return $campo_id;
    }

    foreach ($orari as $fascia) {
        inserisciOrarioCampo($conn, $campo_id, $fascia);
    }

    return $campo_id;
    }
function inserisciOrarioCampo($conn, $campo_id, $fascia)
    {
    $parts = explode("-", $fascia);

    if (count($parts) != 2) return false;

    $start = trim($parts[0]);
    $end = trim($parts[1]);

    $sql = "INSERT INTO CAMPO_ORARI (CAMPO_ID, ORARIO_INIZIO, ORARIO_FINE)
            VALUES (?, ?, ?)";

    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "iss", $campo_id, $start, $end);

    return mysqli_stmt_execute($stmt);
    }
function getCampiByGestore($conn, $id)
    {
    $sql = "SELECT ID, NOME, INDIRIZZO, CITTA, PREZZO 
            FROM CAMPO 
            WHERE FK_GESTORE = ?";

    $stmt = mysqli_prepare($conn, $sql);

    if (!$stmt) {
        return false;
    }

    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);

    $campi = [];

    while ($row = mysqli_fetch_assoc($result)) {

        $row['orari'] = getOrariByCampoId($conn, $row['ID']);

        $campi[] = $row;
    }

    return $campi;
}
function getOrariByCampoId($conn, $campo_id)
    {
    $sql = "SELECT ORARIO_INIZIO, ORARIO_FINE 
            FROM CAMPO_ORARI 
            WHERE CAMPO_ID = ?";

    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "i", $campo_id);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);

    $orari = [];

    while ($row = mysqli_fetch_assoc($result)) {
        $orari[] = [
            "inizio" => $row['ORARIO_INIZIO'],
            "fine" => $row['ORARIO_FINE']
        ];
    }

    return $orari;
    }
?>