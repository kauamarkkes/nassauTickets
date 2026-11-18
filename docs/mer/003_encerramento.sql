-- Execute uma vez em bancos criados antes do encerramento de expediente.
-- Preserve um backup do banco antes de aplicar esta migração.
ALTER TABLE senhas
  ADD COLUMN encerrada_em DATETIME(3) NULL AFTER finalizacao_em,
  DROP CHECK chk_senhas_status,
  ADD CONSTRAINT chk_senhas_status CHECK (status IN (
    'EMITIDA', 'AGUARDANDO', 'CHAMADA', 'CHAMADA_NOVAMENTE',
    'EM_ATENDIMENTO', 'ATENDIDA', 'NÃO_COMPARECEU', 'ENCERRADA'
  ));
