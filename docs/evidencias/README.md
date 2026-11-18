# Evidências de verificação — AV2

Verificações realizadas em 18/11/2026 nesta máquina, com MySQL local. Não há dados de pacientes no banco usado.

| Verificação | Resultado observado |
| --- | --- |
| Sintaxe dos módulos alterados do backend (`node --check`) | Sem erros |
| Frontend (`npm run lint` e `npm run build`) | Ambos concluídos sem erros |
| Conexão e esquema MySQL (`verificarConexao`) | Conexão aceita, tabelas e nova coluna disponíveis |
| Migração `003_encerramento.sql` | Aplicada uma vez após backup local; 7 senhas antigas passaram a `ENCERRADA` |
| Segunda execução do encerramento | 0 alterações, confirmando que a operação não repete registros |
| Resumo e relatório de 16 a 18/11 | 26 senhas; 12 `ATENDIDA`, 7 `ENCERRADA`, 5 `NÃO_COMPARECEU`, 1 `AGUARDANDO`, 1 `CHAMADA`; 26 linhas de detalhe |
| `GET /` e `GET /painel` | HTTP 200; o painel retornou a chamada atual |
| `GET /senhas` e `GET /admin/resumo` sem sessão | HTTP 401 |

O backup local foi guardado na pasta temporária do Windows, fora do repositório. A senha do dia da verificação continuou `AGUARDANDO`; pela regra atual, ela será encerrada somente no dia seguinte se não for atendida.

Ainda requer conferência presencial: reprodução do áudio no Painel após remover o botão, e fluxo completo autenticado no navegador (login, chamada, rechamada, atendimento e relatório). Essas ações dependem de interação e áudio do navegador; não são declaradas como verificadas aqui.
