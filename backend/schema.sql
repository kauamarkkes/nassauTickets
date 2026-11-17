CREATE TABLE IF NOT EXISTS atendentes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  login VARCHAR(80) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('ATENDENTE','GESTOR') NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS estado_fila (
  id INT PRIMARY KEY,
  ultima_foi_sp BOOLEAN NOT NULL DEFAULT FALSE,
  proximo_nao_sp VARCHAR(2) NOT NULL DEFAULT 'SE',
  ordem_chamada BIGINT NOT NULL DEFAULT 0
);
INSERT INTO estado_fila (id, ultima_foi_sp, proximo_nao_sp, ordem_chamada)
VALUES (1, FALSE, 'SE', 0)
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS senhas (
  numero VARCHAR(20) PRIMARY KEY,
  data_emissao VARCHAR(6) NOT NULL,
  tipo VARCHAR(2) NOT NULL,
  sequencia INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'EMITIDA',
  emitida_em DATETIME(3) NOT NULL,
  guiche INT NULL,
  atendente VARCHAR(120) NULL,
  chamadas INT NOT NULL DEFAULT 0,
  primeira_chamada_em DATETIME(3) NULL,
  segunda_chamada_em DATETIME(3) NULL,
  inicio_atendimento_em DATETIME(3) NULL,
  finalizacao_em DATETIME(3) NULL,
  ordem_chamada BIGINT NOT NULL DEFAULT 0,
  INDEX idx_senhas_data_tipo (data_emissao, tipo),
  INDEX idx_senhas_ordem (ordem_chamada)
);

CREATE TABLE IF NOT EXISTS sessoes_atendentes (
  token_hash CHAR(64) PRIMARY KEY,
  atendente_id INT NOT NULL,
  criada_em DATETIME(3) NOT NULL,
  expira_em DATETIME(3) NOT NULL,
  FOREIGN KEY (atendente_id) REFERENCES atendentes(id) ON DELETE CASCADE
);
