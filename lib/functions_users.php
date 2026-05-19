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
    $nome = "%" . $nome . "%";
    $sql = "SELECT p.ID, p.NOME, p.ORARIO, c.INDIRIZZO, COUNT(g.FK_GIOCATORE) AS NUM_GIOCATORI FROM PARTITA p LEFT JOIN CAMPO c ON p.FK_CAMPO = c.ID LEFT JOIN GIOCA g ON g.FK_PARTITA = p.ID WHERE p.NOME LIKE ? GROUP BY p.ID";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "s", $nome);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    return mysqli_fetch_all($result, MYSQLI_ASSOC);
    }
function creaPartita($conn, $nome, $orario, $fk_campo, $max_giocatori = 10)
    {
    if ($max_giocatori < 2)  $max_giocatori = 2;
    if ($max_giocatori > 22) $max_giocatori = 22;
    // i max devono essere pari (due squadre uguali)
    if ($max_giocatori % 2 !== 0) $max_giocatori++;

    $sql = "INSERT INTO PARTITA (NOME, ORARIO, FK_CAMPO, MAX_GIOCATORI, STATO) VALUES (?, ?, ?, ?, 'in_attesa')";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "ssii", $nome, $orario, $fk_campo, $max_giocatori);
    return mysqli_stmt_execute($stmt);
    }
function getPartitaById($conn, $id)
    {
    // partita JOIN campo + count giocatori iscritti
    $sql = "SELECT p.ID, p.NOME, p.ORARIO, p.FK_CAMPO, p.MAX_GIOCATORI, p.STATO,
                   c.NOME AS NOME_CAMPO, c.INDIRIZZO, c.CITTA, c.PREZZO,
                   COUNT(g.FK_GIOCATORE) AS NUM_GIOCATORI
            FROM PARTITA p
            LEFT JOIN CAMPO c ON p.FK_CAMPO = c.ID
            LEFT JOIN GIOCA g ON g.FK_PARTITA = p.ID
            WHERE p.ID = ?
            GROUP BY p.ID";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return null;
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    return $row ?: null;
    }
// Ritorna le due squadre (A e B) con i giocatori iscritti, in ordine d'iscrizione.
function getTeamsByPartita($conn, $idPartita)
    {
    $sql = "SELECT g.FK_GIOCATORE AS ID, g.SQUADRA, gi.NICKNAME
            FROM GIOCA g
            JOIN GIOCATORE gi ON gi.ID = g.FK_GIOCATORE
            WHERE g.FK_PARTITA = ?
            ORDER BY g.SQUADRA, gi.NICKNAME";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return ['A' => [], 'B' => []];
    mysqli_stmt_bind_param($stmt, "i", $idPartita);
    mysqli_stmt_execute($stmt);
    $rs = mysqli_stmt_get_result($stmt);
    $teams = ['A' => [], 'B' => []];
    while ($r = mysqli_fetch_assoc($rs)) {
        $sq = $r['SQUADRA'] === 'B' ? 'B' : 'A';
        $teams[$sq][] = ['id' => (int) $r['ID'], 'nickname' => $r['NICKNAME']];
    }
    return $teams;
    }
// Aggiorna lo stato della partita in base al numero di iscritti.
function aggiornaStatoPartita($conn, $idPartita)
    {
    $sql = "UPDATE PARTITA p
            SET p.STATO = CASE
                WHEN (SELECT COUNT(*) FROM GIOCA g WHERE g.FK_PARTITA = p.ID) >= p.MAX_GIOCATORI THEN 'confermata'
                ELSE 'in_attesa'
            END
            WHERE p.ID = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return false;
    mysqli_stmt_bind_param($stmt, "i", $idPartita);
    return mysqli_stmt_execute($stmt);
    }
function getClubByName($conn, $nome)
    {
    // ricerca club tipo LIKE %nome%
    $like = "%" . $nome . "%";
    $sql = "SELECT c.ID, c.NOME, c.N_COMPONENTI,
                   COUNT(g.ID) AS membri_totali
            FROM CLUB c
            LEFT JOIN GIOCATORE g ON g.FK_CLUB = c.ID
            WHERE c.NOME LIKE ?
            GROUP BY c.ID
            ORDER BY c.NOME";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return [];
    mysqli_stmt_bind_param($stmt, "s", $like);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    return mysqli_fetch_all($result, MYSQLI_ASSOC);
    }
function getClubById($conn, $id)
    {
    // singolo club con conteggio membri reale
    $sql = "SELECT c.ID, c.NOME, c.N_COMPONENTI,
                   COUNT(g.ID) AS membri_totali
            FROM CLUB c
            LEFT JOIN GIOCATORE g ON g.FK_CLUB = c.ID
            WHERE c.ID = ?
            GROUP BY c.ID";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return null;
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    return $row ?: null;
    }
function getCampoById($conn, $id)
    {
    // campo + array di orari
    $sql = "SELECT ID, NOME, INDIRIZZO, CITTA, PREZZO, FK_GESTORE
            FROM CAMPO
            WHERE ID = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return null;
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    if (!$row) return null;
    $row['orari'] = getOrariByCampoId($conn, $row['ID']);
    return $row;
    }
function listAllClubs($conn)
    {
    // tutti i club con conteggio membri reale, ordinati per nome
    $sql = "SELECT c.ID, c.NOME, c.N_COMPONENTI,
                   COUNT(g.ID) AS membri_totali
            FROM CLUB c
            LEFT JOIN GIOCATORE g ON g.FK_CLUB = c.ID
            GROUP BY c.ID
            ORDER BY c.NOME";
    $result = mysqli_query($conn, $sql);
    if (!$result) return [];
    return mysqli_fetch_all($result, MYSQLI_ASSOC);
    }
function getMembriByClub($conn, $clubId)
    {
    // membri (giocatori) di un club
    $sql = "SELECT ID, NICKNAME, EMAIL FROM GIOCATORE WHERE FK_CLUB = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return [];
    mysqli_stmt_bind_param($stmt, "i", $clubId);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    return mysqli_fetch_all($result, MYSQLI_ASSOC);
    }
function creaPrenotazione($conn, $fkGiocatore, $fkCampoOrari, $orario, $prezzo, $numGiocatori, $status = 'pending')
    {
    // INSERT prenotazione, ritorna ID inserito o false
    $sql = "INSERT INTO PRENOTAZIONE (STATUS, ORARIO, FK_GIOCATORE, FK_CAMPO_ORARI, PREZZO, NUM_GIOCATORI)
            VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return false;
    mysqli_stmt_bind_param($stmt, "ssiidi", $status, $orario, $fkGiocatore, $fkCampoOrari, $prezzo, $numGiocatori);
    if (!mysqli_stmt_execute($stmt)) return false;
    return mysqli_insert_id($conn);
    }
function aggiornaStatoPrenotazione($conn, $idPrenotazione, $status)
    {
    // sicurezza: il WHERE include FK_GIOCATORE per evitare scritture cross-utente
    // l'ID giocatore è preso dalla sessione lato endpoint
    $fkGiocatore = isset($_SESSION['idUtente']) ? (int) $_SESSION['idUtente'] : 0;
    $sql = "UPDATE PRENOTAZIONE SET STATUS = ? WHERE ID = ? AND FK_GIOCATORE = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return false;
    mysqli_stmt_bind_param($stmt, "sii", $status, $idPrenotazione, $fkGiocatore);
    if (!mysqli_stmt_execute($stmt)) return false;
    return mysqli_stmt_affected_rows($stmt) > 0;
    }
function iscriviGiocatoreAPartita($conn, $fkGiocatore, $fkPartita, $squadra = 'A')
    {
    // Vincolo: ogni squadra puo' avere al massimo MAX_GIOCATORI/2 iscritti.
    $squadra = $squadra === 'B' ? 'B' : 'A';

    // 1) recupero MAX_GIOCATORI della partita
    $sqlP = "SELECT MAX_GIOCATORI FROM PARTITA WHERE ID = ?";
    $stmt = mysqli_prepare($conn, $sqlP);
    if (!$stmt) return ['ok' => false, 'message' => 'Errore DB'];
    mysqli_stmt_bind_param($stmt, "i", $fkPartita);
    mysqli_stmt_execute($stmt);
    $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (!$row) return ['ok' => false, 'message' => 'Partita non trovata'];
    $max = (int) $row['MAX_GIOCATORI'];
    $maxPerSquadra = (int) ($max / 2);

    // 2) controllo capienza squadra scelta
    $sqlC = "SELECT COUNT(*) AS n FROM GIOCA WHERE FK_PARTITA = ? AND SQUADRA = ?";
    $stmt = mysqli_prepare($conn, $sqlC);
    if (!$stmt) return ['ok' => false, 'message' => 'Errore DB'];
    mysqli_stmt_bind_param($stmt, "is", $fkPartita, $squadra);
    mysqli_stmt_execute($stmt);
    $r2 = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if ((int) $r2['n'] >= $maxPerSquadra) {
        return ['ok' => false, 'message' => "Squadra $squadra al completo ($maxPerSquadra/$maxPerSquadra)"];
    }

    // 3) insert; se gia' iscritto in altra squadra, aggiorna la squadra
    $sql = "INSERT INTO GIOCA (FK_GIOCATORE, FK_PARTITA, SQUADRA)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE SQUADRA = VALUES(SQUADRA)";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return ['ok' => false, 'message' => 'Errore DB'];
    mysqli_stmt_bind_param($stmt, "iis", $fkGiocatore, $fkPartita, $squadra);
    if (!mysqli_stmt_execute($stmt)) {
        return ['ok' => false, 'message' => 'Errore iscrizione'];
    }

    // 4) aggiorno lo stato della partita (confermata se sold-out)
    aggiornaStatoPartita($conn, $fkPartita);

    return ['ok' => true, 'message' => 'Iscritto', 'squadra' => $squadra];
    }
function rimuoviGiocatoreDaPartita($conn, $fkGiocatore, $fkPartita)
    {
    $sql = "DELETE FROM GIOCA WHERE FK_GIOCATORE = ? AND FK_PARTITA = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return false;
    mysqli_stmt_bind_param($stmt, "ii", $fkGiocatore, $fkPartita);
    return mysqli_stmt_execute($stmt);
    }
function creaProposta($conn, $fkClub, $fkGiocatore, $testo, $orario, $nomeCampo, $maxGiocatori)
    {
    // INSERT proposta, ritorna ID o false
    $sql = "INSERT INTO PROPOSTA (FK_CLUB, FK_GIOCATORE, TESTO, ORARIO, NOME_CAMPO, MAX_GIOCATORI)
            VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return false;
    mysqli_stmt_bind_param($stmt, "iisssi", $fkClub, $fkGiocatore, $testo, $orario, $nomeCampo, $maxGiocatori);
    if (!mysqli_stmt_execute($stmt)) return false;
    return mysqli_insert_id($conn);
    }
function getProposteByClub($conn, $fkClub, $limit = 20)
    {
    // proposte del club + nickname autore
    $limit = (int) $limit;
    if ($limit <= 0) $limit = 20;
    $sql = "SELECT p.ID, p.TESTO, p.ORARIO, p.NOME_CAMPO, p.MAX_GIOCATORI, p.CREATED_AT,
                   g.NICKNAME
            FROM PROPOSTA p
            LEFT JOIN GIOCATORE g ON g.ID = p.FK_GIOCATORE
            WHERE p.FK_CLUB = ?
            ORDER BY p.CREATED_AT DESC
            LIMIT ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return [];
    mysqli_stmt_bind_param($stmt, "ii", $fkClub, $limit);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    return mysqli_fetch_all($result, MYSQLI_ASSOC);
    }
function aggiornaProfiloGiocatore($conn, $id, $nickname, $email)
    {
    $sql = "UPDATE GIOCATORE SET NICKNAME = ?, EMAIL = ? WHERE ID = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return false;
    mysqli_stmt_bind_param($stmt, "ssi", $nickname, $email, $id);
    return mysqli_stmt_execute($stmt);
    }
function getProfiloGiocatore($conn, $id)
    {
    $sql = "SELECT ID, NICKNAME, EMAIL, FK_CLUB FROM GIOCATORE WHERE ID = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return null;
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    return $row ?: null;
    }
function registraGestore($conn, $nome_centro, $email, $password)
    {
    $passwordSafe = password_hash($password, PASSWORD_DEFAULT);

    $sql = "INSERT INTO GESTORE (NOME_CENTRO, EMAIL, PWD) VALUES (?, ?, ?)";
    $stmt = mysqli_prepare($conn, $sql);

    mysqli_stmt_bind_param($stmt, "sss", $nome_centro, $email, $passwordSafe);

    return mysqli_stmt_execute($stmt);
    }
function getProfiloGestore($conn, $id)
    {
    $sql = "SELECT ID, NOME_CENTRO, EMAIL FROM GESTORE WHERE ID = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return null;
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    return mysqli_fetch_assoc($result) ?: null;
    }
function aggiornaProfiloGestore($conn, $id, $nome_centro, $email)
    {
    $sql = "UPDATE GESTORE SET NOME_CENTRO = ?, EMAIL = ? WHERE ID = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return false;
    mysqli_stmt_bind_param($stmt, "ssi", $nome_centro, $email, $id);
    return mysqli_stmt_execute($stmt);
    }
// Iscrive un giocatore a un club: setta giocatore.FK_CLUB.
// Rifiuta se il club ha gia' raggiunto N_COMPONENTI iscritti.
function iscriviGiocatoreAClub($conn, $idGiocatore, $idClub)
    {
    // controllo capienza
    $sqlCount = "SELECT c.N_COMPONENTI, COUNT(g.ID) AS membri
                 FROM CLUB c
                 LEFT JOIN GIOCATORE g ON g.FK_CLUB = c.ID
                 WHERE c.ID = ?
                 GROUP BY c.ID";
    $stmt = mysqli_prepare($conn, $sqlCount);
    if (!$stmt) return ['ok' => false, 'message' => 'Errore DB'];
    mysqli_stmt_bind_param($stmt, "i", $idClub);
    mysqli_stmt_execute($stmt);
    $r = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (!$r) return ['ok' => false, 'message' => 'Club non trovato'];
    if ((int)$r['membri'] >= (int)$r['N_COMPONENTI']) {
        return ['ok' => false, 'message' => 'Club al completo'];
    }

    $sql = "UPDATE GIOCATORE SET FK_CLUB = ? WHERE ID = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return ['ok' => false, 'message' => 'Errore DB'];
    mysqli_stmt_bind_param($stmt, "ii", $idClub, $idGiocatore);
    $ok = mysqli_stmt_execute($stmt);
    return ['ok' => (bool)$ok, 'message' => $ok ? 'Iscritto' : 'Errore'];
    }
// Prenotazioni di campo del giocatore SOLO PER OGGI (paid).
function getPrenotazioniByGiocatore($conn, $idGiocatore)
    {
    $sql = "SELECT pr.ID, pr.STATUS, pr.ORARIO, pr.PREZZO, pr.CREATED_AT,
                   c.ID AS CAMPO_ID, c.NOME AS NOME_CAMPO, c.INDIRIZZO, c.CITTA,
                   co.ORARIO_INIZIO, co.ORARIO_FINE
            FROM PRENOTAZIONE pr
            LEFT JOIN CAMPO_ORARI co ON co.ID = pr.FK_CAMPO_ORARI
            LEFT JOIN CAMPO c ON c.ID = co.CAMPO_ID
            WHERE pr.FK_GIOCATORE = ?
              AND DATE(pr.CREATED_AT) = CURDATE()
              AND pr.STATUS = 'paid'
            ORDER BY co.ORARIO_INIZIO";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return [];
    mysqli_stmt_bind_param($stmt, "i", $idGiocatore);
    mysqli_stmt_execute($stmt);
    $rs = mysqli_stmt_get_result($stmt);
    return mysqli_fetch_all($rs, MYSQLI_ASSOC);
    }
// Partite a cui il giocatore e' iscritto OGGI (uso giornaliero).
// Le partite di ieri spariscono automaticamente dalla lista "le mie partite".
function getPartiteIscritto($conn, $idGiocatore)
    {
    $sql = "SELECT p.ID, p.NOME, p.ORARIO, p.MAX_GIOCATORI, p.STATO,
                   c.NOME AS NOME_CAMPO, c.INDIRIZZO, c.CITTA, c.PREZZO,
                   g.SQUADRA,
                   (SELECT COUNT(*) FROM GIOCA gg WHERE gg.FK_PARTITA = p.ID) AS NUM_GIOCATORI
            FROM GIOCA g
            JOIN PARTITA p ON p.ID = g.FK_PARTITA
            LEFT JOIN CAMPO c ON c.ID = p.FK_CAMPO
            WHERE g.FK_GIOCATORE = ?
              AND p.ORARIO LIKE CONCAT(CURDATE(), '%')
            ORDER BY p.ORARIO";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return [];
    mysqli_stmt_bind_param($stmt, "i", $idGiocatore);
    mysqli_stmt_execute($stmt);
    $rs = mysqli_stmt_get_result($stmt);
    return mysqli_fetch_all($rs, MYSQLI_ASSOC);
    }
function abbandonaClub($conn, $idGiocatore)
    {
    $sql = "UPDATE GIOCATORE SET FK_CLUB = NULL WHERE ID = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return false;
    mysqli_stmt_bind_param($stmt, "i", $idGiocatore);
    return mysqli_stmt_execute($stmt);
    }
// Slot orari fissi: ogni campo ha sempre 12 fasce da 1 ora dalle 10 alle 22.
function getStandardOrari()
{
    $slots = [];
    for ($h = 10; $h < 22; $h++) {
        $slots[] = sprintf('%02d:00-%02d:00', $h, $h + 1);
    }
    return $slots;
}

function registraCampo($conn, $nome, $indirizzo, $citta, $prezzo, $fk_gestore, $orari = null)
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

    // Se il client non passa orari, usiamo i 12 slot standard (10-22).
    if (!$orari || !is_array($orari) || count($orari) === 0) {
        $orari = getStandardOrari();
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
    $end   = trim($parts[1]);

    // DISPONIBILE=1 di default (slot libero). Diventa 0 quando viene prenotato.
    $sql = "INSERT INTO CAMPO_ORARI (CAMPO_ID, ORARIO_INIZIO, ORARIO_FINE, DISPONIBILE)
            VALUES (?, ?, ?, 1)";

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
    $sql = "SELECT co.ID, co.ORARIO_INIZIO, co.ORARIO_FINE, co.DISPONIBILE,
                   (SELECT COUNT(*)
                    FROM PRENOTAZIONE p
                    WHERE p.FK_CAMPO_ORARI = co.ID
                      AND p.STATUS = 'paid'
                      AND DATE(p.CREATED_AT) = CURDATE()) AS prenotato_oggi
            FROM CAMPO_ORARI co
            WHERE co.CAMPO_ID = ?
            ORDER BY co.ORARIO_INIZIO";

    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "i", $campo_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $orari = [];
    while ($row = mysqli_fetch_assoc($result)) {
        // occupato se: prenotazione paid oggi OPPURE gestore ha settato manualmente DISPONIBILE=0
        $prenotato   = ((int) $row['prenotato_oggi']) > 0;
        $flagOccupato = ((int) $row['DISPONIBILE']) === 0;

        $orari[] = [
            'id'          => (int) $row['ID'],
            'inizio'      => $row['ORARIO_INIZIO'],
            'fine'        => $row['ORARIO_FINE'],
            'disponibile' => !$prenotato && !$flagOccupato,
        ];
    }
    return $orari;
}
// ================================================================
// CHAT CLUB — PROPOSTE AVANZATE
// ================================================================

/**
 * Ritorna le proposte attive di un club con:
 *  - numero di adesioni
 *  - flag se l'utente corrente ha già aderito
 *  - secondi rimanenti prima che scada (30 minuti dalla creazione)
 */
function getProposteConAdesioni($conn, $fkClub, $fkGiocatoreCorrente, $limit = 20)
{
    $limit               = (int) $limit;
    if ($limit <= 0) $limit = 20;
    $fkGiocatoreCorrente = (int) $fkGiocatoreCorrente;

    $sql = "SELECT
                p.ID, p.TESTO, p.ORARIO, p.DATA, p.NOME_CAMPO,
                p.MAX_GIOCATORI, p.STATO, p.CREATED_AT,
                g.NICKNAME,
                g.ID AS FK_GIOCATORE_AUTORE,
                COUNT(DISTINCT a.FK_GIOCATORE)                                 AS NUM_ADESIONI,
                SUM(CASE WHEN a.FK_GIOCATORE = ? THEN 1 ELSE 0 END)           AS IO_HO_ADERITO,
                GREATEST(0, 1800 - TIMESTAMPDIFF(SECOND, p.CREATED_AT, NOW())) AS SECONDI_RIMANENTI
            FROM PROPOSTA p
            LEFT JOIN GIOCATORE g         ON g.ID = p.FK_GIOCATORE
            LEFT JOIN proposta_adesione a ON a.FK_PROPOSTA = p.ID
            WHERE p.FK_CLUB = ?
            GROUP BY p.ID
            ORDER BY p.CREATED_AT DESC
            LIMIT ?";

    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return [];
    mysqli_stmt_bind_param($stmt, "iii", $fkGiocatoreCorrente, $fkClub, $limit);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $rows   = mysqli_fetch_all($result, MYSQLI_ASSOC);

    foreach ($rows as &$r) {
        $r['NUM_ADESIONI']          = (int)  $r['NUM_ADESIONI'];
        $r['IO_HO_ADERITO']         = (bool) $r['IO_HO_ADERITO'];
        $r['MAX_GIOCATORI']         = (int)  $r['MAX_GIOCATORI'];
        $r['SECONDI_RIMANENTI']     = (int)  $r['SECONDI_RIMANENTI'];
        $r['FK_GIOCATORE_AUTORE']   = (int)  $r['FK_GIOCATORE_AUTORE'];
        $r['SCADUTA']               = ($r['STATO'] === 'scaduta');
    }
    unset($r);
    return $rows;
}

/**
 * Ritorna la proposta attiva corrente di un club (se esiste), con secondi passati.
 * Usata per bloccare nuove proposte mentre una è in corso.
 */
function getPropostaAttivaByClub($conn, $fkClub)
{
    $sql = "SELECT ID, TESTO, ORARIO, DATA, NOME_CAMPO, MAX_GIOCATORI, CREATED_AT,
                   TIMESTAMPDIFF(SECOND, CREATED_AT, NOW()) AS SECONDI_PASSATI
            FROM PROPOSTA
            WHERE FK_CLUB = ?
              AND STATO = 'attiva'
            ORDER BY CREATED_AT DESC
            LIMIT 1";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return null;
    mysqli_stmt_bind_param($stmt, "i", $fkClub);
    mysqli_stmt_execute($stmt);
    $row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    return $row ?: null;
}

/**
 * Aggiunge un'adesione (idempotente grazie all'UNIQUE KEY).
 * Se raggiunge MAX_GIOCATORI marca la proposta come 'confermata'.
 * Ritorna ['ok'=>bool, 'num_adesioni'=>int, 'confermata'=>bool, 'message'=>string]
 */
function aggiungiAdesioneProposta($conn, $fkProposta, $fkGiocatore)
{
    $fkProposta  = (int) $fkProposta;
    $fkGiocatore = (int) $fkGiocatore;

    $sqlP = "SELECT MAX_GIOCATORI, STATO FROM PROPOSTA WHERE ID = ?";
    $stmt = mysqli_prepare($conn, $sqlP);
    if (!$stmt) return ['ok' => false, 'message' => 'Errore DB'];
    mysqli_stmt_bind_param($stmt, "i", $fkProposta);
    mysqli_stmt_execute($stmt);
    $prop = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
    if (!$prop)                         return ['ok' => false, 'message' => 'Proposta non trovata'];
    if ($prop['STATO'] === 'confermata') return ['ok' => false, 'message' => 'Partita già al completo'];
    if ($prop['STATO'] !== 'attiva')     return ['ok' => false, 'message' => 'Proposta non più attiva'];

    $sqlI = "INSERT IGNORE INTO proposta_adesione (FK_PROPOSTA, FK_GIOCATORE) VALUES (?, ?)";
    $stmt = mysqli_prepare($conn, $sqlI);
    if (!$stmt) return ['ok' => false, 'message' => 'Errore DB'];
    mysqli_stmt_bind_param($stmt, "ii", $fkProposta, $fkGiocatore);
    mysqli_stmt_execute($stmt);

    $sqlC = "SELECT COUNT(*) AS n FROM proposta_adesione WHERE FK_PROPOSTA = ?";
    $stmt = mysqli_prepare($conn, $sqlC);
    mysqli_stmt_bind_param($stmt, "i", $fkProposta);
    mysqli_stmt_execute($stmt);
    $cnt = (int) mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))['n'];

    $confermata = false;
    if ($cnt >= (int) $prop['MAX_GIOCATORI']) {
        $sqlU = "UPDATE PROPOSTA SET STATO = 'confermata' WHERE ID = ?";
        $stmt = mysqli_prepare($conn, $sqlU);
        mysqli_stmt_bind_param($stmt, "i", $fkProposta);
        mysqli_stmt_execute($stmt);
        $confermata = true;
    }

    return ['ok' => true, 'num_adesioni' => $cnt, 'confermata' => $confermata, 'message' => 'OK'];
}

/**
 * Rimuove l'adesione di un giocatore a una proposta.
 */
function rimuoviAdesioneProposta($conn, $fkProposta, $fkGiocatore)
{
    $sql  = "DELETE FROM proposta_adesione WHERE FK_PROPOSTA = ? AND FK_GIOCATORE = ?";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return false;
    mysqli_stmt_bind_param($stmt, "ii", $fkProposta, $fkGiocatore);
    return mysqli_stmt_execute($stmt);
}

/**
 * Marca come 'scaduta' la proposta attiva del club se sono passati >= 30 minuti.
 * Va chiamata all'inizio di ogni API della chat.
 */
function scadisciProposteOld($conn, $fkClub)
{
    $sql  = "UPDATE PROPOSTA
             SET STATO = 'scaduta'
             WHERE FK_CLUB = ?
               AND STATO = 'attiva'
               AND TIMESTAMPDIFF(MINUTE, CREATED_AT, NOW()) >= 30";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return;
    mysqli_stmt_bind_param($stmt, "i", $fkClub);
    mysqli_stmt_execute($stmt);
}

/**
 * Crea una nuova proposta (unica attiva per club alla volta — controllo nel controller).
 */
function creaPropostaCompleta($conn, $fkClub, $fkGiocatore, $testo, $orario, $data, $nomeCampo, $maxGiocatori)
{
    $sql  = "INSERT INTO PROPOSTA
                 (FK_CLUB, FK_GIOCATORE, TESTO, ORARIO, DATA, NOME_CAMPO, MAX_GIOCATORI, STATO)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'attiva')";
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) return false;
    mysqli_stmt_bind_param($stmt, "iissssi",
        $fkClub, $fkGiocatore, $testo, $orario, $data, $nomeCampo, $maxGiocatori);
    if (!mysqli_stmt_execute($stmt)) return false;
    return mysqli_insert_id($conn);
}
