-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Creato il: Mag 05, 2026 alle 16:17
-- Versione del server: 10.4.32-MariaDB
-- Versione PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `goaltogo`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `campo`
--

CREATE TABLE `campo` (
  `ID` bigint(20) UNSIGNED NOT NULL,
  `NOME` varchar(255) NOT NULL,
  `INDIRIZZO` varchar(80) NOT NULL,
  `CITTA` varchar(255) NOT NULL,
  `PREZZO` decimal(10,2) NOT NULL,
  `FK_GESTORE` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `campo_orari`
--

CREATE TABLE `campo_orari` (
  `ID` bigint(20) NOT NULL,
  `CAMPO_ID` bigint(20) NOT NULL,
  `ORARIO_INIZIO` time(6) NOT NULL,
  `ORARIO_FINE` time(6) NOT NULL,
  `DISPONIBILE` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `club`
--

CREATE TABLE `club` (
  `ID` bigint(20) UNSIGNED NOT NULL,
  `N_COMPONENTI` int(11) NOT NULL,
  `NOME` varchar(40) NOT NULL,
  `DESCRIZIONE` varchar(280) DEFAULT NULL,
  `VISIBILITA` varchar(16) DEFAULT 'pubblico',
  `FK_GIOCATORE` bigint(20) UNSIGNED DEFAULT NULL,
  `CREATED_AT` timestamp DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `gestore`
--

CREATE TABLE `gestore` (
  `ID` bigint(20) NOT NULL,
  `NOME_CENTRO` varchar(80) NOT NULL,
  `EMAIL` varchar(320) NOT NULL,
  `PWD` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `gestore`
--

INSERT INTO `gestore` (`ID`, `NOME_CENTRO`, `EMAIL`, `PWD`) VALUES
(1, 'mamma', 'marta.nicolettialtimari@gmail.com', '$2y$10$qETiVw9toQE6XJLkvLP14eeZh8aJ9ZyPfalMGD56/RPjRXEJ8sWDq');

-- --------------------------------------------------------

--
-- Struttura della tabella `gioca`
--

CREATE TABLE `gioca` (
  `FK_GIOCATORE` int(11) NOT NULL,
  `FK_PARTITA` int(11) NOT NULL,
  `SQUADRA` varchar(1) NOT NULL DEFAULT 'A'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `giocatore`
--

CREATE TABLE `giocatore` (
  `ID` bigint(20) UNSIGNED NOT NULL,
  `NICKNAME` varchar(40) NOT NULL,
  `EMAIL` varchar(320) NOT NULL,
  `PWD` varchar(255) NOT NULL,
  `FK_CLUB` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `giocatore`
--

INSERT INTO `giocatore` (`ID`, `NICKNAME`, `EMAIL`, `PWD`, `FK_CLUB`) VALUES
(3, 'prova2', 'prova2@gmail.com', '$2y$10$MFECFk9Qv5fiKimfZpr3/.o96df9GPs5Kva7g2/V59cpJbJn2m8eO', NULL),
(4, 'Kratos_125', 'eugenio.russo125@gmail.com', '$2y$10$J.p6m85iTCPxzfLd.SZpIuQK4K53Wb1nAd6vMydawqZIwfqz/bVbO', NULL),
(6, '2131721', 'mariooo.tiri@gmail.com', '$2y$10$4PBZiK3i3AePxrtzK7nAoOdQeIN8baaQ/m7M/XJ4YwYm6B4JRPhBa', NULL),
(7, 'cacca', 'tiriticco.2131721@studenti.uniroma1.it', '$2y$10$SaHYdN8jgY3RiomeYQXXiuxalR29fwUD4SsHD5RwYyhFLdbdA9Oue', NULL),
(8, 'try', 'try@gmail.com', '$2y$10$5y75HWtsfUvbV9DEnSY.dera0aIEWtcTKGRiL2HHfTZZ6guNfTx6y', NULL);

-- --------------------------------------------------------

--
-- Struttura della tabella `partita`
--

CREATE TABLE `partita` (
  `ID` bigint(20) UNSIGNED NOT NULL,
  `NOME` varchar(40) NOT NULL,
  `ORARIO` varchar(16) NOT NULL,
  `FK_CAMPO` int(11) DEFAULT NULL,
  `MAX_GIOCATORI` int(11) NOT NULL DEFAULT 10,
  `STATO` varchar(16) NOT NULL DEFAULT 'in_attesa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `prenotazione`
--

CREATE TABLE `prenotazione` (
  `ID` bigint(20) UNSIGNED NOT NULL,
  `STATUS` varchar(16) DEFAULT 'pending',
  `ORARIO` varchar(16) NOT NULL,
  `FK_PARTITA` int(11) DEFAULT NULL,
  `FK_GIOCATORE` bigint(20) DEFAULT NULL,
  `FK_CAMPO_ORARI` bigint(20) DEFAULT NULL,
  `PREZZO` decimal(10,2) DEFAULT NULL,
  `NUM_GIOCATORI` int(11) DEFAULT NULL,
  `CREATED_AT` timestamp DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struttura della tabella `proposta`
--

CREATE TABLE `proposta` (
  `ID` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `FK_CLUB` bigint(20) UNSIGNED NOT NULL,
  `FK_GIOCATORE` bigint(20) UNSIGNED NOT NULL,
  `TESTO` varchar(160) NOT NULL,
  `ORARIO` varchar(16) DEFAULT NULL,
  `NOME_CAMPO` varchar(80) DEFAULT NULL,
  `MAX_GIOCATORI` int(11) DEFAULT 10,
  `CREATED_AT` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  KEY `idx_proposta_club` (`FK_CLUB`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `campo`
--
ALTER TABLE `campo`
  ADD PRIMARY KEY (`ID`);

--
-- Indici per le tabelle `campo_orari`
--
ALTER TABLE `campo_orari`
  ADD PRIMARY KEY (`ID`);

--
-- Indici per le tabelle `club`
--
ALTER TABLE `club`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `NOME` (`NOME`);

--
-- Indici per le tabelle `gestore`
--
ALTER TABLE `gestore`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `NOME_CENTRO` (`NOME_CENTRO`),
  ADD UNIQUE KEY `EMAIL` (`EMAIL`);

--
-- Indici per le tabelle `gioca`
--
ALTER TABLE `gioca`
  ADD PRIMARY KEY (`FK_GIOCATORE`,`FK_PARTITA`);

--
-- Indici per le tabelle `giocatore`
--
ALTER TABLE `giocatore`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `EMAIL` (`EMAIL`);

--
-- Indici per le tabelle `partita`
--
ALTER TABLE `partita`
  ADD PRIMARY KEY (`ID`);

--
-- Indici per le tabelle `prenotazione`
--
ALTER TABLE `prenotazione`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `FK_PARTITA` (`FK_PARTITA`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `campo`
--
ALTER TABLE `campo`
  MODIFY `ID` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT per la tabella `campo_orari`
--
ALTER TABLE `campo_orari`
  MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- AUTO_INCREMENT per la tabella `club`
--
ALTER TABLE `club`
  MODIFY `ID` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `gestore`
--
ALTER TABLE `gestore`
  MODIFY `ID` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT per la tabella `giocatore`
--
ALTER TABLE `giocatore`
  MODIFY `ID` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT per la tabella `partita`
--
ALTER TABLE `partita`
  MODIFY `ID` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `prenotazione`
--
ALTER TABLE `prenotazione`
  MODIFY `ID` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
