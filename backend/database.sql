Enter password: 
/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.20-13.0.2-MariaDB, for Android (aarch64)
--
-- Host: localhost    Database: nassauTickets
-- ------------------------------------------------------
-- Server version	13.0.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `atendentes`
--

DROP TABLE IF EXISTS `atendentes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `atendentes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(80) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `perfil` enum('ATENDENTE','GESTOR') NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login` (`login`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atendentes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `atendentes` WRITE;
/*!40000 ALTER TABLE `atendentes` DISABLE KEYS */;
INSERT INTO `atendentes` VALUES
(1,'admin','Administrador','scrypt$16384$8$5$34f0840f7a97bd06c4e70d6460d4d78c$be2d49811dc3880bf9ca555fb4743b36e9468ccc3790afec74f10d37a84d52bf','GESTOR',1),
(2,'nassau','Nassau','scrypt$16384$8$5$cc33c8a8c051ae8ab4c59e14bf5b25b8$739ef449adcb868909ce63b40894683b6bf51fac36e154df3c65a22625e19c01','GESTOR',1);
/*!40000 ALTER TABLE `atendentes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `estado_fila`
--

DROP TABLE IF EXISTS `estado_fila`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `estado_fila` (
  `id` int(11) NOT NULL,
  `ultima_foi_sp` tinyint(1) NOT NULL DEFAULT 0,
  `proximo_nao_sp` varchar(2) NOT NULL DEFAULT 'SE',
  `ordem_chamada` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estado_fila`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `estado_fila` WRITE;
/*!40000 ALTER TABLE `estado_fila` DISABLE KEYS */;
INSERT INTO `estado_fila` VALUES
(1,0,'SG',18);
/*!40000 ALTER TABLE `estado_fila` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `senhas`
--

DROP TABLE IF EXISTS `senhas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `senhas` (
  `numero` varchar(20) NOT NULL,
  `data_emissao` varchar(6) NOT NULL,
  `tipo` varchar(5) NOT NULL,
  `sequencia` int(11) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'AGUARDANDO',
  `emitida_em` datetime NOT NULL,
  `guiche` int(11) DEFAULT NULL,
  `atendente` varchar(100) DEFAULT NULL,
  `chamadas` int(11) NOT NULL DEFAULT 0,
  `primeira_chamada_em` datetime DEFAULT NULL,
  `segunda_chamada_em` datetime DEFAULT NULL,
  `inicio_atendimento_em` datetime DEFAULT NULL,
  `finalizacao_em` datetime DEFAULT NULL,
  `ordem_chamada` int(11) NOT NULL DEFAULT 0,
  `encerrada_em` datetime DEFAULT NULL,
  PRIMARY KEY (`numero`),
  KEY `idx_fila` (`data_emissao`,`status`,`sequencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `senhas`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `senhas` WRITE;
/*!40000 ALTER TABLE `senhas` DISABLE KEYS */;
INSERT INTO `senhas` VALUES
('261117-SE001','261117','SE',1,'ATENDIDA','2026-11-17 16:44:58',2,'Nassau',1,'2026-11-17 16:56:11',NULL,'2026-11-17 17:15:43','2026-11-17 17:15:43',2,NULL),
('261117-SE002','261117','SE',2,'ATENDIDA','2026-11-17 17:18:21',1,'Nassau',1,'2026-11-17 17:18:46',NULL,'2026-11-17 17:19:09','2026-11-17 17:19:09',6,NULL),
('261117-SG001','261117','SG',1,'ATENDIDA','2026-11-17 16:44:58',4,'Nassau',1,'2026-11-17 16:56:12',NULL,'2026-11-17 17:15:43','2026-11-17 17:15:43',4,NULL),
('261117-SG002','261117','SG',2,'ATENDIDA','2026-11-17 17:18:21',3,'Nassau',1,'2026-11-17 17:18:46',NULL,'2026-11-17 17:19:09','2026-11-17 17:19:09',8,NULL),
('261117-SP001','261117','SP',1,'ATENDIDA','2026-11-17 16:44:58',1,'Nassau',1,'2026-11-17 16:56:11',NULL,'2026-11-17 17:15:43','2026-11-17 17:15:43',1,NULL),
('261117-SP002','261117','SP',2,'ATENDIDA','2026-11-17 16:44:58',3,'Nassau',1,'2026-11-17 16:56:11',NULL,'2026-11-17 17:15:43','2026-11-17 17:15:43',3,NULL),
('261117-SP003','261117','SP',3,'ATENDIDA','2026-11-17 16:44:58',5,'Nassau',1,'2026-11-17 16:56:12',NULL,'2026-11-17 17:15:43','2026-11-17 17:15:43',5,NULL),
('261117-SP004','261117','SP',4,'ATENDIDA','2026-11-17 17:18:21',2,'Nassau',1,'2026-11-17 17:18:46',NULL,'2026-11-17 17:19:09','2026-11-17 17:19:09',7,NULL),
('261117-SP005','261117','SP',5,'ATENDIDA','2026-11-17 17:18:21',4,'Nassau',1,'2026-11-17 17:18:46',NULL,'2026-11-17 17:19:09','2026-11-17 17:19:09',9,NULL),
('261117-SP006','261117','SP',6,'ATENDIDA','2026-11-17 17:18:22',5,'Nassau',1,'2026-11-17 17:18:46',NULL,'2026-11-17 17:19:09','2026-11-17 17:19:10',10,NULL),
('261118-SE001','261118','SE',1,'ATENDIDA','2026-11-18 13:53:43',1,'Nassau',1,'2026-11-18 13:54:57',NULL,'2026-11-18 13:55:01','2026-11-18 13:55:05',11,NULL),
('261118-SE002','261118','SE',2,'NÃO_COMPARECEU','2026-11-18 13:53:48',1,'Nassau',2,'2026-11-18 14:02:16','2026-11-18 14:02:18',NULL,'2026-11-18 14:02:20',18,NULL),
('261118-SE003','261118','SE',3,'AGUARDANDO','2026-11-18 13:53:49',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SE004','261118','SE',4,'AGUARDANDO','2026-11-18 13:54:01',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SE005','261118','SE',5,'AGUARDANDO','2026-11-18 14:02:01',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SE006','261118','SE',6,'AGUARDANDO','2026-11-18 14:02:03',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SG001','261118','SG',1,'ATENDIDA','2026-11-18 13:53:47',1,'Nassau',1,'2026-11-18 13:55:29',NULL,'2026-11-18 13:55:36','2026-11-18 13:55:37',14,NULL),
('261118-SG002','261118','SG',2,'AGUARDANDO','2026-11-18 13:53:49',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SG003','261118','SG',3,'AGUARDANDO','2026-11-18 13:53:50',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SG004','261118','SG',4,'AGUARDANDO','2026-11-18 13:54:02',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SG005','261118','SG',5,'AGUARDANDO','2026-11-18 14:02:00',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SG006','261118','SG',6,'AGUARDANDO','2026-11-18 14:02:02',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SP001','261118','SP',1,'ATENDIDA','2026-11-18 13:53:35',1,'Nassau',2,'2026-11-18 13:55:06','2026-11-18 13:55:17','2026-11-18 13:55:24','2026-11-18 13:55:27',13,NULL),
('261118-SP002','261118','SP',2,'CHAMADA_NOVAMENTE','2026-11-18 13:53:38',5,'Nassau',2,'2026-11-18 13:55:50','2026-11-18 14:01:23',NULL,NULL,16,NULL),
('261118-SP003','261118','SP',3,'AGUARDANDO','2026-11-18 13:53:54',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SP004','261118','SP',4,'AGUARDANDO','2026-11-18 13:53:58',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SP005','261118','SP',5,'AGUARDANDO','2026-11-18 14:01:23',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SP006','261118','SP',6,'AGUARDANDO','2026-11-18 14:01:23',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL),
('261118-SP007','261118','SP',7,'AGUARDANDO','2026-11-18 14:01:59',NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL);
/*!40000 ALTER TABLE `senhas` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `sessoes_atendentes`
--

DROP TABLE IF EXISTS `sessoes_atendentes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessoes_atendentes` (
  `token_hash` char(64) NOT NULL,
  `atendente_id` int(11) NOT NULL,
  `criada_em` datetime(3) NOT NULL,
  `expira_em` datetime(3) NOT NULL,
  PRIMARY KEY (`token_hash`),
  KEY `atendente_id` (`atendente_id`),
  CONSTRAINT `1` FOREIGN KEY (`atendente_id`) REFERENCES `atendentes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessoes_atendentes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `sessoes_atendentes` WRITE;
/*!40000 ALTER TABLE `sessoes_atendentes` DISABLE KEYS */;
INSERT INTO `sessoes_atendentes` VALUES
('a2efed8f8caf9f63191c019aa5d52bc975e79b81e4fa1c859a0f51b410a5e95f',2,'2026-11-17 16:56:11.746','2026-11-18 00:56:11.746'),
('c5bfc4b5c3e799c2c679384050dec0b6eec3ac0838b8a69bbf3370012163e77b',2,'2026-11-17 17:13:59.906','2026-11-18 01:13:59.906');
/*!40000 ALTER TABLE `sessoes_atendentes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `cargo` varchar(20) NOT NULL DEFAULT 'atendente',
  `criado_em` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-11-18 13:38:17
