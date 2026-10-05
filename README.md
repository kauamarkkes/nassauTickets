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
* Persistência das senhas em arquivo JSON no backend.

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
* **Persistência:** arquivo JSON no backend.
* **Comunicação:** API REST utilizando `fetch`.
* **Desenvolvimento:** Nodemon, npm, Git e GitHub.

O frontend realiza requisições HTTP para a API Express. O backend controla a fila, as chamadas, os estados das senhas e a persistência dos dados.

A comunicação entre frontend e backend é centralizada pelos arquivos `api.js` e `storage.js`, enquanto o `server.js` é responsável pelas regras e operações da API.

## Estrutura do repositório

```text
nassauTickets/
├── backend/
│   ├── data/
│   │   └── senhas.json
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

É necessário ter Node.js, npm e Git instalados. O frontend e o backend devem rodar em **terminais separados**.

Clone o repositório:

```cmd
git clone https://github.com/kauamarkkes/nassauTickets.git
cd nassauTickets
```

No primeiro terminal, inicie o backend:

```cmd
cd backend
npm install
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3000
```

Também é possível iniciar o backend com:

```cmd
npm start
```

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

As senhas são controladas pelo backend e armazenadas no arquivo:

```text
backend/data/senhas.json
```

O arquivo mantém as senhas emitidas e as informações necessárias para controlar a sequência da fila.

A API carrega os dados do arquivo quando o servidor é iniciado e grava as alterações realizadas durante a execução. Dessa forma, as senhas permanecem armazenadas mesmo após o reinício do servidor.

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
