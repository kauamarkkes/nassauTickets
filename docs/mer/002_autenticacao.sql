-- Execute no mesmo banco indicado por DB_NAME, após 001_senhas_fila.sql.
CREATE TABLE IF NOT EXISTS atendentes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  login VARCHAR(80) NOT NULL,
  nome VARCHAR(120) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) NOT NULL DEFAULT 'ATENDENTE',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_atendentes_login (login),
  CONSTRAINT chk_atendentes_perfil CHECK (perfil IN ('ATENDENTE', 'GESTOR'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessoes_atendentes (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  atendente_id BIGINT UNSIGNED NOT NULL,
  criada_em DATETIME(3) NOT NULL,
  expira_em DATETIME(3) NOT NULL,
  PRIMARY KEY (token_hash),
  KEY idx_sessoes_expira (expira_em),
  KEY idx_sessoes_atendente (atendente_id),
  CONSTRAINT fk_sessoes_atendente FOREIGN KEY (atendente_id)
    REFERENCES atendentes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
