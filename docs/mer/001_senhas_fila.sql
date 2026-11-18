-- Execute no banco indicado por DB_NAME (nassauTickets neste projeto).
-- Datas e horários de eventos são armazenados em UTC.

CREATE TABLE IF NOT EXISTS senhas (
  numero CHAR(12) NOT NULL,
  data_emissao CHAR(6) NOT NULL,
  tipo CHAR(2) NOT NULL,
  sequencia SMALLINT UNSIGNED NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'AGUARDANDO',
  emitida_em DATETIME(3) NOT NULL,
  guiche SMALLINT UNSIGNED NULL,
  atendente VARCHAR(120) NULL,
  chamadas TINYINT UNSIGNED NOT NULL DEFAULT 0,
  primeira_chamada_em DATETIME(3) NULL,
  segunda_chamada_em DATETIME(3) NULL,
  inicio_atendimento_em DATETIME(3) NULL,
  finalizacao_em DATETIME(3) NULL,
  encerrada_em DATETIME(3) NULL,
  ordem_chamada BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (numero),
  UNIQUE KEY uq_senhas_dia_tipo_sequencia (data_emissao, tipo, sequencia),
  KEY idx_senhas_fila (data_emissao, status, tipo, sequencia),
  KEY idx_senhas_painel (ordem_chamada),
  CONSTRAINT chk_senhas_tipo CHECK (tipo IN ('SP', 'SG', 'SE')),
  CONSTRAINT chk_senhas_sequencia CHECK (sequencia BETWEEN 1 AND 999),
  CONSTRAINT chk_senhas_status CHECK (status IN (
    'EMITIDA', 'AGUARDANDO', 'CHAMADA', 'CHAMADA_NOVAMENTE',
    'EM_ATENDIMENTO', 'ATENDIDA', 'NÃO_COMPARECEU', 'ENCERRADA'
  )),
  CONSTRAINT chk_senhas_chamadas CHECK (chamadas BETWEEN 0 AND 2),
  CONSTRAINT chk_senhas_guiche CHECK (guiche IS NULL OR guiche > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS estado_fila (
  id TINYINT UNSIGNED NOT NULL,
  ultima_foi_sp BOOLEAN NOT NULL DEFAULT FALSE,
  proximo_nao_sp CHAR(2) NOT NULL DEFAULT 'SE',
  ordem_chamada BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT chk_estado_fila_id CHECK (id = 1),
  CONSTRAINT chk_estado_fila_proximo CHECK (proximo_nao_sp IN ('SE', 'SG'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO estado_fila (id) VALUES (1)
ON DUPLICATE KEY UPDATE id = id;
