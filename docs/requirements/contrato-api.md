# Contrato da API — AV2

URL padrão: `http://localhost:3000`. O frontend usa `VITE_API_URL` para outra URL e envia `credentials: "include"` para incluir o cookie de sessão. As respostas são JSON. Em erro, o corpo tem a forma `{ "erro": "mensagem" }`.

## Acesso

| Operação | Método e rota | Corpo | Resposta de sucesso |
| --- | --- | --- | --- |
| Login | `POST /auth/login` | `{ "login": "atendente", "senha": "<digitada pelo usuário>" }` | `{ "usuario": { "id": 1, "login": "atendente", "nome": "Atendente 01", "perfil": "ATENDENTE" } }` e cookie HttpOnly |
| Sessão | `GET /auth/session` | nenhum | `{ "usuario": { "id": 1, "login": "atendente", "nome": "Atendente 01", "perfil": "ATENDENTE" } }` |
| Logout | `POST /auth/logout` | nenhum | `{ "mensagem": "Sessão encerrada." }` |
| Redefinição local | `POST /auth/reset-test` | `{ "login", "codigo", "novaSenha" }` | Mensagem de confirmação; disponível somente com configuração local e fora de produção |

O navegador não armazena a senha. Ausência de sessão ou credenciais inválidas retorna `401`. Rotas `/admin/*` exigem perfil `GESTOR`; um atendente recebe `403`.

## Senhas e atendimento

| Operação | Método e rota | Corpo | Exemplo de resposta |
| --- | --- | --- | --- |
| Emitir | `POST /senhas` | `{ "tipo": "SP" }` | senha criada, como abaixo; HTTP `201` |
| Listar | `GET /senhas` | nenhum | lista de senhas; exige sessão |
| Chamar próxima | `POST /atendimentos/proxima` | `{ "guiche": 1 }` | senha com `status: "CHAMADA"`; exige sessão |
| Chamar novamente | `POST /senhas/:numero/chamar-novamente` | nenhum | senha com `status: "CHAMADA_NOVAMENTE"` |
| Iniciar | `PATCH /senhas/:numero/iniciar` | nenhum | senha com `status: "EM_ATENDIMENTO"` |
| Finalizar | `PATCH /senhas/:numero/finalizar` | nenhum | senha com `status: "ATENDIDA"` |
| Não compareceu | `PATCH /senhas/:numero/nao-compareceu` | nenhum | senha com `status: "NÃO_COMPARECEU"` |
| Painel | `GET /painel` | nenhum | `{ "atual": <senha ou null>, "anteriores": [<até 4 senhas>] }` |

Exemplo reduzido de senha; a resposta real também traz horários de emissão, chamadas e atendimento:

```json
{ "numero": "261118-SP001", "tipo": "SP", "status": "AGUARDANDO", "guiche": null, "atendente": null, "chamadas": 0, "ordemChamada": 0 }
```

O servidor decide a próxima senha e registra o nome do atendente da sessão. O frontend não envia esse nome. Tipo inválido retorna `400`, fila vazia `404`, ação incompatível ou guichê ocupado `409`. Emissão e nova chamada fora das 7h às 17h retornam `409`, salvo `DEMO_OUTSIDE_HOURS=true` em desenvolvimento.

## Gestão

| Método e rota | Finalidade |
| --- | --- |
| `GET /admin/resumo?inicio=2026-11-01&fim=2026-11-30` | Totais e gráficos por tipo, situação e dia |
| `GET /admin/relatorio?inicio=2026-11-01&fim=2026-11-30` | Totais atendidos, tempo médio e linhas de auditoria |
| `GET /admin/usuarios` | Usuários sem hashes |
| `POST /admin/usuarios` | Cadastro com `{ "login", "nome", "perfil", "senha" }` |
| `POST /admin/usuarios/redefinir-senha` | Redefinição com `{ "login", "novaSenha" }` |
| `GET /admin/fila` | Consulta da próxima preferência SE/SG |
| `PUT /admin/fila` | Alteração com `{ "proximoNaoPrioritario": "SE" }` ou `SG` |

Os filtros do resumo e relatório aceitam datas `AAAA-MM-DD`, período de até 366 dias, `tipo` (`SP`, `SE`, `SG`), `status` (inclusive `ENCERRADA`) e `guiche`. O relatório detalhado retorna `detalhes` com número, tipo, situação, emissão, guichê, atendente e horários da primeira chamada, segunda chamada, início, fim e encerramento.

## Falha e contingência

O frontend mostra erro quando a API não responde. O painel oferece **Tentar novamente** e uma demonstração local claramente identificada; esses dados nunca são enviados ao banco. Totem e terminal não simulam emissão ou atendimento durante falha.
