<?php
require_once __DIR__ . '/../lib/auth.php';
auth_init();
auth_require();

require_once '../config/db_connection.php';
require_once '../lib/functions_users.php';

header('Content-Type: application/json');

$nome       = trim((string) ($_GET['nome_partita'] ?? ''));
$quando     = trim((string) ($_GET['quando'] ?? ''));
$max_prezzo = isset($_GET['max_prezzo']) && $_GET['max_prezzo'] !== '' ? (float) $_GET['max_prezzo'] : null;

// query base con join campo per poter filtrare per prezzo
$sql = "SELECT p.ID, p.NOME, p.ORARIO, p.FK_CAMPO,
               c.NOME AS NOME_CAMPO, c.INDIRIZZO, c.CITTA, c.PREZZO,
               COUNT(g.FK_GIOCATORE) AS NUM_GIOCATORI
        FROM PARTITA p
        LEFT JOIN CAMPO c ON p.FK_CAMPO = c.ID
        LEFT JOIN GIOCA g ON g.FK_PARTITA = p.ID";

$where  = [];
$types  = '';
$params = [];

// filtro nome
if ($nome !== '') {
    $where[] = "p.NOME LIKE ?";
    $types  .= 's';
    $params[] = "%" . $nome . "%";
}

// L'app è a uso giornaliero: di default tutte le query sono ristrette a oggi.
// I filtri "mattina" e "sera" restringono ulteriormente la fascia ORARIA di oggi.
$oggi = date('Y-m-d');
$where[] = "p.ORARIO LIKE ?";
$types  .= 's';
$params[] = $oggi . "%";

// ORARIO è varchar(16) tipo "YYYY-MM-DDTHH:MM"; l'ora sta in posizione 12-13.
if ($quando === 'mattina') {
    $where[] = "(SUBSTRING(p.ORARIO, 12, 2) BETWEEN '10' AND '13')";
} elseif ($quando === 'sera') {
    $where[] = "(SUBSTRING(p.ORARIO, 12, 2) BETWEEN '18' AND '22')";
}
// 'oggi' (default) o vuoto: nessun filtro orario aggiuntivo

// filtro prezzo massimo
if ($max_prezzo !== null && $max_prezzo > 0) {
    $where[] = "c.PREZZO <= ?";
    $types  .= 'd';
    $params[] = $max_prezzo;
}

if (!empty($where)) {
    $sql .= " WHERE " . implode(' AND ', $where);
}

$sql .= " GROUP BY p.ID ORDER BY p.ORARIO";

$stmt = mysqli_prepare($conn, $sql);
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Errore query: ' . mysqli_error($conn)]);
    exit;
}

if (!empty($params)) {
    // bind dinamico: trasformiamo l'array in riferimenti
    $bindArgs = [];
    $bindArgs[] = $types;
    foreach ($params as $k => $v) {
        $bindArgs[] = &$params[$k];
    }
    call_user_func_array([$stmt, 'bind_param'], $bindArgs);
}

mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$res = mysqli_fetch_all($result, MYSQLI_ASSOC);

if (empty($res)) {
    echo json_encode(['status' => 'error', 'message' => 'Nessuna partita trovata']);
} else {
    echo json_encode($res);
}

mysqli_close($conn);
?>
