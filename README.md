# nassauTickets

Sistema web de controle de atendimento para um laboratório de análises clínicas. O cliente retira uma senha no Totem, o atendente controla as chamadas no guichê e o Painel mostra a chamada atual e as últimas senhas atendidas.

Repositório: https://github.com/kauamarkkes/nassauTickets

## Informações acadêmicas

* **Curso:** Ciência da Computação
* **Disciplina:** Back-end Frameworks
* **Período:** 2026.2
* **Instituição:** UNINASSAU – Graças
* **Professor:** João Ferreira da Silva Junior
* **Entrega atual:** AV1

## Problema e público-alvo

Em um laboratório, os clientes precisam saber qual senha retirar, quando serão chamados e a qual guichê devem se dirigir. O nassauTickets organiza a fila de atendimento e apresenta as chamadas em uma interface para clientes e atendentes.

O sistema é direcionado principalmente para laboratórios e ambientes de atendimento que precisam organizar filas, chamadas e o fluxo de atendimento dos clientes.

## Membros

| Nome           | Matrícula | Papel                        | Contribuição                                                            |
| -------------- | --------- | ---------------------------- | ----------------------------------------------------------------------- |
| Kauã Henrique  | 01846088  | Scrum Master / Desenvolvedor | Estrutura do projeto, rotas e integração.                               |
| Lázaro Antonio | 01806289  | Desenvolvedor                | Layout, estilos e componentes.                                          |
| João Erick     | 01849942  | Desenvolvedor                | Totem e emissão de senhas.                                              |
| Bruno José     | 01847870  | Desenvolvedor                | Página inicial, Painel, Atendimento e integração das páginas com a API. |

## Funcionalidades implementadas

* Emissão de senhas SP (prioritária), SG (geral) e SE (retirada de exames).
* Numeração das senhas por data e tipo.
* Consulta das senhas emitidas.
* Chamada da próxima senha no guichê.
* Rechamada de senha.
* Início e finalização do atendimento.
* Registro de não comparecimento após duas chamadas.
* Controle dos estados das senhas durante o atendimento.
* Painel com a chamada atual e as últimas chamadas.
* Contagem das senhas aguardando atendimento.
* Comunicação entre as páginas React e a API Express.
* Persistência das senhas em MySQL no backend.

## Rotas do frontend

| Rota           | Página                |
| -------------- | --------------------- |
| `/`            | Início                |
| `/totem`       | Emissão de senhas     |
| `/painel`      | Painel de chamadas    |
| `/atendimento` | Terminal do atendente |

## Tecnologias e arquitetura

* **Frontend:** React, JavaScript, Vite, React Router e CSS.
* **Backend:** Node.js, Express e CORS.
* **Persistência:** MySQL 8.0 no backend.
* **Comunicação:** API REST utilizando `fetch`.
* **Desenvolvimento:** Nodemon, npm, Git e GitHub.

O frontend realiza requisições HTTP para a API Express. O backend controla a fila, as chamadas, os estados das senhas e a persistência dos dados.

A comunicação entre frontend e backend é centralizada pelos arquivos `api.js` e `storage.js`. O `server.js` expõe a API e `senhasRepository.js` executa as operações no MySQL.

## Estrutura do repositório

```text
nassauTickets/
├── backend/
│   ├── data/
│   │   └── senhas.json (legado, não utilizado pela API)
│   └── src/
│       └── server.js
├── docs/
│   ├── branding/
│   ├── mer/
│   ├── mockups/
│   ├── models/
│   │   └── uml/
│   └── requirements/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── routes/
│       ├── styles/
│       ├── api.js
│       ├── storage.js
│       └── main.jsx
├── .gitignore
├── LICENSE
└── README.md
```

As pastas de documentação vazias devem conter `.gitkeep` para aparecerem no GitHub.

## Instalação e execução

É necessário ter Node.js 22.9 ou superior da linha 22 LTS, npm, Git e acesso a um servidor MySQL 8.0 em execução. O frontend e o backend devem rodar em **terminais separados**.

Clone o repositório:

```cmd
git clone https://github.com/kauamarkkes/nassauTickets.git
cd nassauTickets
```

No primeiro terminal, instale as dependências do backend e copie o exemplo de configuração:

```cmd
cd backend
npm install
copy .env.example .env
```

No PowerShell, o equivalente à cópia é `Copy-Item .env.example .env`. Se a política do PowerShell bloquear `npm`, utilize `npm.cmd` nos comandos.

Edite `backend/.env` localmente e informe o usuário, a senha e o nome do banco MySQL. Se o arquivo já existir, adicione `DB_NAME=nassauTickets`, preservando as credenciais existentes. Não envie esse arquivo ou suas credenciais ao GitHub ou à conversa.

| Variável | Finalidade | Padrão |
| --- | --- | --- |
| `PORT` | Porta HTTP do Express | `3000` |
| `DB_HOST` | Endereço do servidor MySQL | `127.0.0.1` |
| `DB_PORT` | Porta do MySQL (1 a 65535) | `3306` |
| `DB_USER` | Usuário MySQL com acesso ao servidor | Obrigatório |
| `DB_PASSWORD` | Senha do usuário MySQL | Obrigatório |
| `DB_NAME` | Banco existente que será selecionado pelo pool | Obrigatório; exemplo: `nassauTickets` |

Os scripts carregam `.env` com o recurso nativo do Node.js `--env-file-if-exists`. Variáveis já definidas no ambiente têm precedência. Também é possível executar sem esse arquivo, desde que as variáveis obrigatórias estejam configuradas no ambiente.

Antes da primeira execução, crie o banco vazio pelo editor SQL do MySQL Workbench, conectado ao mesmo servidor configurado no `.env`:

```sql
CREATE DATABASE IF NOT EXISTS nassauTickets CHARACTER SET utf8mb4;
```

Esse comando preserva um banco existente. O backend seleciona o banco configurado, mas não cria bancos nem tabelas automaticamente. No MySQL configurado para normalizar nomes em minúsculas, como nesta instalação Windows, `nassauTickets` pode aparecer como `nassautickets`.

Depois de selecionar esse banco no Workbench, execute `docs/mer/001_senhas_fila.sql`. O script cria as tabelas `senhas` e `estado_fila` e inicia o controle da fila; pode ser executado novamente sem apagar registros. Os campos de horário representam UTC. Execute `npm test` em `backend/` para verificar o repositório em transações que são desfeitas ao final.

Inicie o backend, ainda no diretório `backend/`:

```cmd
npm run dev
```

O backend usa `mysql2/promise` com um pool compartilhado de até cinco conexões e tempo limite de conexão de dez segundos. O pool seleciona o banco indicado em `DB_NAME`. Antes de abrir a porta HTTP, confirma a conexão e a linha de controle da fila. Se o banco ou o esquema não estiver pronto, a inicialização falha. Todas as rotas de senhas e atendimento usam MySQL.

Com a conexão validada, a API ficará disponível em:

```text
http://localhost:3000
```

Também é possível iniciar o backend com:

```cmd
npm start
```

Para verificar manualmente, abra `http://localhost:3000/`: a resposta deve continuar sendo `{"mensagem":"API nassauTickets funcionando"}`. Encerre com `Ctrl+C` para fechar o servidor HTTP e o pool MySQL.

Se o MySQL estiver indisponível ou as credenciais forem inválidas, a API não abrirá a porta HTTP e o processo terminará com erro. No modo de desenvolvimento, o Nodemon poderá permanecer aguardando alterações; após corrigir o ambiente, reinicie o comando. O log mostra o código do erro sem exibir as credenciais:

- `DB_CONFIG_INVALID`: preencha usuário, senha e nome do banco e confira a porta MySQL.
- `ECONNREFUSED`: confirme que o MySQL está iniciado e ouvindo no endereço e porta configurados.
- `ER_ACCESS_DENIED_ERROR`: confira usuário, senha e permissão de acesso a partir deste computador.
- `ER_BAD_DB_ERROR`: confira `DB_NAME` e se o banco existe no servidor configurado.
- `ER_DBACCESS_DENIED_ERROR`: confira a permissão do usuário para acessar o banco selecionado.
- `ENOTFOUND` ou `ETIMEDOUT`: confira endereço, rede e disponibilidade do servidor.
- `EADDRINUSE`: a porta HTTP já está sendo usada por outro processo.

No segundo terminal, a partir da raiz `nassauTickets`, inicie o frontend:

```cmd
cd frontend
npm install
npm run dev
```

Abra o endereço informado pelo Vite, normalmente:

```text
http://localhost:5173
```

O backend precisa estar em execução para que o frontend possa emitir, consultar e controlar as senhas.

A URL padrão da API é `http://localhost:3000`. O frontend pode utilizar a variável `VITE_API_URL` para configurar outra URL.

## Rotas da API

| Método  | Rota                               | Finalidade                                     |
| ------- | ---------------------------------- | ---------------------------------------------- |
| `GET`   | `/`                                | Verificar se a API está funcionando.           |
| `GET`   | `/senhas`                          | Listar todas as senhas.                        |
| `POST`  | `/senhas`                          | Emitir uma nova senha.                         |
| `POST`  | `/atendimentos/proxima`            | Chamar a próxima senha.                        |
| `PATCH` | `/senhas/:numero/iniciar`          | Iniciar o atendimento.                         |
| `PATCH` | `/senhas/:numero/finalizar`        | Finalizar o atendimento.                       |
| `POST`  | `/senhas/:numero/chamar-novamente` | Realizar uma nova chamada.                     |
| `PATCH` | `/senhas/:numero/nao-compareceu`   | Registrar não comparecimento.                  |
| `GET`   | `/painel`                          | Consultar chamada atual e chamadas anteriores. |

Para emitir uma senha, a API recebe o tipo:

```json
{
  "tipo": "SP"
}
```

Os tipos disponíveis são:

* `SP` — prioritária
* `SG` — geral
* `SE` — retirada de exames

As rotas que utilizam `:numero` devem receber o número completo da senha, por exemplo:

```text
/senhas/261004-SP001/iniciar
```

A API retorna respostas de erro em JSON para entradas inválidas, senha não encontrada, fila vazia ou ações incompatíveis com o estado atual da senha.

## Regras de atendimento

O sistema utiliza uma sequência de atendimento que prioriza as senhas preferenciais e alterna com os demais tipos.

A sequência segue a regra:

```text
SP → SE/SG → SP → SE/SG
```

As senhas possuem estados que representam seu ciclo de atendimento:

```text
EMITIDA
   ↓
AGUARDANDO
   ↓
CHAMADA
   ↓
CHAMADA_NOVAMENTE
   ↓
EM_ATENDIMENTO
   ↓
ATENDIDA
```

Caso o cliente não compareça após duas chamadas, a senha pode ser registrada como:

```text
NÃO_COMPARECEU
```

## Dados e persistência

As senhas são armazenadas na tabela `senhas`, e a sequência de chamadas na tabela `estado_fila`. O arquivo `backend/data/senhas.json` é legado e não é lido nem gravado pelo servidor. Dados antigos existentes nele exigiriam migração separada antes de descartar o arquivo.

A numeração segue o formato:

```text
YYMMDD-PPSQ
```

Exemplo:

```text
261004-SP001
```

Onde:

* `YYMMDD` representa a data.
* `PP` representa o tipo da senha.
* `SQ` representa a sequência numérica.

A sequência é reiniciada de acordo com a data.

## Limitações e próximos passos

* Melhorar filtros e ordenação das informações.
* Evoluir a validação dos formulários.
* Implementar autenticação e controle de acesso.
* Adicionar gerenciamento de sessão.
* Implementar relatórios e informações de auditoria mais completas.
* Evoluir o controle de expediente.
* Adicionar tratamento de falhas e cenários de indisponibilidade da API.
* Evoluir as funcionalidades previstas para a AV2.

A AV2 manterá o mesmo tema e repositório e prevê autenticação, gerenciamento de sessão e rotas protegidas.

## Branches e entrega

O desenvolvimento ocorre na branch `dev`. Após revisão, o código é integrado à `main` por merge.

Os commits devem registrar etapas reais do desenvolvimento e permitir identificar as contribuições dos integrantes.

A entrega da AV1 pelo Teams deve informar:

* URL do repositório;
* commit avaliado;
* tag `entrega-av1`.

## Uso de inteligência artificial

O grupo utilizou ChatGPT como apoio para compreender erros, discutir a estrutura do projeto, sugerir trechos de código e revisar a documentação.

As sugestões foram conferidas e testadas pelos integrantes, que são responsáveis pela implementação, funcionamento e apresentação do projeto.

## Licença

MIT. Consulte o arquivo `LICENSE` na raiz do repositório.
