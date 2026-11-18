# Visão geral da aplicação e da API

## Arquitetura

O projeto tem três partes: interface React/Vite em `frontend/`, API Express em `backend/` e persistência MySQL 8. O navegador chama a API com `fetch`; o backend valida as operações e consulta o MySQL por `mysql2/promise`. A URL da API é centralizada em `frontend/src/api.js`, configurável por `VITE_API_URL`; sem configuração, usa `http://localhost:3000`.

## API e persistência

O contrato detalhado está em [contrato-api.md](../requirements/contrato-api.md). As rotas principais são:

| Método e rota | Uso | Acesso |
| --- | --- | --- |
| `POST /senhas` | Emitir senha SP, SE ou SG | Público |
| `GET /painel` | Obter chamada atual e chamadas anteriores | Público |
| `GET /senhas` | Listar senhas da fila | Sessão |
| `POST /atendimentos/proxima` | Chamar próxima senha para um guichê | Sessão |
| `POST /senhas/:numero/chamar-novamente` | Registrar segunda chamada | Sessão |
| `PATCH /senhas/:numero/iniciar` | Iniciar atendimento | Sessão |
| `PATCH /senhas/:numero/finalizar` | Marcar senha como atendida | Sessão |
| `PATCH /senhas/:numero/nao-compareceu` | Registrar ausência após duas chamadas | Sessão |
| `GET /admin/resumo` | Indicadores filtrados por período, tipo, estado e guichê | Gestor |
| `GET /admin/relatorio` | Detalhes e duração dos atendimentos | Gestor; endpoint disponível, seção visual removida |
| `GET/POST /admin/usuarios` | Listar e cadastrar usuários | Gestor |
| `POST /admin/usuarios/redefinir-senha` | Redefinir senha e invalidar sessões anteriores | Gestor |
| `GET/PUT /admin/fila` | Consultar e escolher a próxima preferência SE/SG | Gestor |

As respostas são JSON. Os erros de entrada incluem 400, fila vazia 404, ausência de sessão 401, autorização recusada 403 e conflitos de estado 409. O backend valida os dados, usa parâmetros SQL e agrupa operações críticas em transações. `backend/src/db.js` configura o pool MySQL; `senhasRepository.js` implementa fila e estados; `adminRepository.js` contém consultas e operações administrativas.

## Autenticação e permanência da sessão

`POST /auth/login` consulta a conta ativa e compara a senha com o hash `scrypt`. Em sucesso, o servidor gera um token aleatório, guarda no MySQL somente o hash do token e envia o token ao navegador em cookie `HttpOnly`, `SameSite=Lax`, com duração de oito horas. Em produção o cookie também usa `Secure`.

O frontend não guarda a senha nem o token em `localStorage`. `frontend/src/App.jsx` consulta `/auth/session` ao iniciar a aplicação; o navegador envia o cookie porque `apiRequest` define `credentials: "include"`. Quando o servidor confirma a sessão, o React mantém o usuário no estado da aplicação após recarregar a página. Isso é restauração consultando o servidor, não uma sessão independente no armazenamento local.

Ao sair, `POST /auth/logout` apaga a sessão no banco e limpa o cookie. Rotas protegidas usam `ProtectedRoute`; o backend também protege endpoints, exigindo sessão e perfil gestor quando necessário. Senha redefinida encerra sessões anteriores do usuário. A redefinição `/auth/reset-test` só pode ser habilitada localmente por variáveis do `.env` e é desativada em produção.

## Frontend: rotas, telas e componentes

`frontend/src/routes/paths.js` centraliza caminhos. `AppRoutes.jsx` associa cada caminho à página e aplica `ProtectedRoute` para `/atendimento` e `/admin`. `App.jsx` compartilha propriedades de sessão e funções de entrada/expiração entre o cabeçalho e as rotas.

As páginas estão em `frontend/src/pages/`: `Home`, `Totem`, `Painel`, `Attendant`, `Login`, `ResetTest` e `Admin`. Componentes reaproveitados em `frontend/src/components/` incluem `Header`, `Footer`, `Button`, `Card`, `Message`, `TicketTypeBadge` e `ProtectedRoute`. Props transmitem dados e ações, por exemplo `usuario` e `aoSair` no `Header`, `sessao` em `ProtectedRoute`, e `aoEntrar`/`aoSessaoExpirada` entre `App` e rotas.

`frontend/src/storage.js` agrupa funções que chamam endpoints de senhas; `api.js` faz a requisição HTTP comum. `numeroFalado.js` converte o número para o anúncio por voz, usado pelo Painel e pelo Atendimento. Permanecem separados porque atendem responsabilidades diferentes e são compartilhados por várias telas.

## Verificações e limitações

Lint e build do frontend passaram nas verificações locais recentes. As rotas públicas e os erros de API foram conferidos com MySQL local; o fluxo autenticado completo ainda precisa de validação manual no navegador. A interface de relatório do gestor foi retirada; o endpoint administrativo continua no backend. A regra de horário descrita nos requisitos dos professores foi removida por decisão do responsável e precisa ser tratada como divergência conhecida na apresentação.
