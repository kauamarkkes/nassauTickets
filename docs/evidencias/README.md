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

Ainda requer conferência presencial: fluxo autenticado completo no navegador (login, chamada, rechamada e atendimento). A interface de relatório do gestor foi removida; a rota de relatório permanece na API. O usuário confirmou que o áudio do Painel está funcionando em seu navegador.

## Verificação adicional do backend

Em 18/11/2026, uma instância local separada conectou ao MySQL e respondeu: `GET /` e `GET /painel` com HTTP 200; rotas protegidas sem sessão com HTTP 401; tipo de senha inválido e JSON malformado com HTTP 400 em JSON. O fluxo autenticado com credenciais reais não foi repetido nesta verificação.
