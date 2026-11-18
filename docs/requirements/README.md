# Requisitos e regras de negócio

Referências: *Atividade — Sistema para controle de atendimento*, *Sistema para controle de atendimento* e *Projeto Evolutivo AV1–AV2*, fornecidos pelos professores.

## Requisitos funcionais

| ID | Requisito | Situação no código |
| --- | --- | --- |
| RF01 | Emitir senhas SP, SG e SE no formato `YYMMDD-PPSQ`, com sequência diária por tipo | Implementado |
| RF02 | Chamar próxima senha respeitando a alternância SP e SE/SG | Implementado no backend |
| RF03 | Rechamar, iniciar, finalizar e registrar não comparecimento após duas chamadas | Implementado |
| RF04 | Exibir senha, guichê e até cinco chamadas no painel, sem antecipar a próxima | Implementado no código atual |
| RF05 | Autenticar atendente, restaurar sessão, proteger rotas e permitir logout | Implementado |
| RF06 | Permitir gestão de usuários e consulta de indicadores | Implementado |
| RF07 | Relatórios diário e mensal, detalhe das senhas, tempo médio e auditoria | Implementado no código atual; integração com MySQL pendente de conferência |
| RF08 | Restringir emissão e novas chamadas ao expediente de 7h às 17h | Implementado no código atual |
| RF09 | Registrar formalmente o descarte de senhas pendentes ao fim do expediente | Pendente; as pendentes deixam de ser elegíveis |

## Regras de negócio

- SP alterna com senhas não prioritárias; entre SE e SG, o gestor pode escolher qual será considerada primeiro.
- Qualquer guichê pode atender qualquer tipo. Um guichê não recebe nova senha enquanto possui uma ativa.
- A senha só pode ser finalizada após o início do atendimento. Não comparecimento exige duas chamadas.
- O painel mostra chamadas realizadas, nunca uma previsão da próxima senha.
- O percentual de cerca de 5% de senhas não atendidas descrito na especificação é uma referência histórica, não uma instrução para descartar aleatoriamente clientes reais.

## Requisitos não funcionais

- **Segurança:** senhas armazenadas como hash; sessões protegidas no servidor; consultas SQL parametrizadas; `.env` fora do Git.
- **Concorrência:** a seleção da próxima senha usa transação e bloqueio do estado da fila no MySQL.
- **Disponibilidade:** as telas mostram falhas da API; o painel possui nova tentativa e demonstração local identificada.
- **LGPD:** não são cadastrados nomes ou resultados de pacientes; os dados operacionais contêm número da senha e identificação do atendente.
- **Acessibilidade:** botões com rótulos, foco visível, mensagens de erro com `role="alert"` e painel com atualização acessível.

## Casos de uso principais

1. Cliente escolhe SP, SG ou SE no totem e recebe um número.
2. Atendente autenticado informa o guichê, chama a próxima senha e registra o atendimento ou ausência.
3. Cliente acompanha número e guichê no painel.
4. Gestor filtra indicadores, consulta o relatório e administra usuários e a ordem SE/SG.
