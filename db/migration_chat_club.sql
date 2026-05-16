-- ============================================================
-- MIGRATION: Chat Club — GoalToGo
-- Esegui questo file su phpMyAdmin → database "goaltogo"
-- tab "SQL" → incolla → clicca "Esegui"
--
-- È sicuro: usa IF NOT EXISTS e IF EXISTS, 
-- quindi non rompe nulla se eseguito più volte.
-- ============================================================

USE `goaltogo`;

-- ------------------------------------------------------------
-- 1. Aggiungi colonna STATO alla tabella proposta
--    (attiva | scaduta | confermata)
-- ------------------------------------------------------------
ALTER TABLE `proposta`
  ADD COLUMN IF NOT EXISTS `STATO` varchar(20) NOT NULL DEFAULT 'attiva'
  AFTER `MAX_GIOCATORI`;

-- ------------------------------------------------------------
-- 2. Aggiungi colonna DATA alla tabella proposta
--    (data della partita proposta, opzionale)
-- ------------------------------------------------------------
ALTER TABLE `proposta`
  ADD COLUMN IF NOT EXISTS `DATA` date DEFAULT NULL
  AFTER `ORARIO`;

-- ------------------------------------------------------------
-- 3. Aggiungi AUTO_INCREMENT a proposta se mancante
--    (nel DB originale non c'era, serviva per INSERT)
-- ------------------------------------------------------------
ALTER TABLE `proposta`
  MODIFY `ID` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

-- ------------------------------------------------------------
-- 4. Crea tabella proposta_adesione
--    Tiene traccia di chi ha accettato quale proposta.
--    UNIQUE KEY impedisce doppie adesioni.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `proposta_adesione` (
  `ID`           bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `FK_PROPOSTA`  bigint(20) UNSIGNED NOT NULL,
  `FK_GIOCATORE` bigint(20) UNSIGNED NOT NULL,
  `CREATED_AT`   timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `uq_adesione` (`FK_PROPOSTA`, `FK_GIOCATORE`),
  KEY `idx_adesione_proposta` (`FK_PROPOSTA`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Fine migration
