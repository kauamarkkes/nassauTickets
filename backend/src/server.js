import express from "express";
import cors from "cors";
import { verificarConexao, encerrarPool } from "./db.js";
import { redefinirSenhaAtendente } from "./auth/resetPassword.js";
import {
  obterResumoDia, listarUsuarios, criarUsuario, redefinirSenhaUsuario,
  obterOrdemFila, definirOrdemFila,
} from "./adminRepository.js";
import {
  criarSessao, usuarioDaSessao, encerrarSessao,
  definirCookieSessao, limparCookieSessao,
} from "./auth/session.js";
import {
  listarSenhas,
  emitirSenha,
  chamarProxima,
  iniciarAtendimento,
  finalizarAtendimento,
  chamarNovamente,
  marcarNaoCompareceu,
  obterPainel,
} from "./senhasRepository.js";

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use((req, res, next) => {
  const origem = req.get("Origin");
  const mesmaOrigem = origem === `${req.protocol}://${req.get("host")}`;
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      origem && origem !== FRONTEND_ORIGIN && !mesmaOrigem) {
    return res.status(403).json({ erro: "Origem não permitida." });
  }
  next();
});

function rota(operacao) {
  return async (req, res) => {
    try {
      const { status = 200, dados } = await operacao(req, res);
      res.status(status).json(dados);
    } catch (erro) {
      const status = erro.status ?? (erro.code === "TIPO_INVALIDO" ? 400 : erro.code === "LIMITE_DIARIO" ? 409 : 500);
      if (status === 500) {
        // Evita expor consultas ou dados da conexão em respostas e logs.
        console.error(`Falha na API (${erro.code || "ERRO_DESCONHECIDO"}).`);
      }
      res.status(status).json({
        erro: status === 500 ? "Não foi possível concluir a operação." : erro.message,
      });
    }
  };
}

function rotaAutenticada(operacao) {
  return rota(async (req, res) => {
    req.usuario = await usuarioDaSessao(req);
    if (!req.usuario) {
      const erro = new Error("Autenticação necessária.");
      erro.status = 401;
      throw erro;
    }
    return operacao(req, res);
  });
}

function rotaGestor(operacao) {
  return rotaAutenticada(async (req, res) => {
    if (req.usuario.perfil !== "GESTOR") {
      const erro = new Error("Acesso reservado ao gestor.");
      erro.status = 403;
      throw erro;
    }
    return operacao(req, res);
  });
}

app.get("/", (_req, res) => {
  res.json({ mensagem: "API nassauTickets funcionando" });
});

app.post("/auth/login", rota(async (req, res) => {
  const sessao = await criarSessao(req.body?.login, req.body?.senha);
  if (!sessao) {
    const erro = new Error("Credenciais inválidas.");
    erro.status = 401;
    throw erro;
  }
  definirCookieSessao(res, sessao.token);
  return { dados: { usuario: sessao.usuario } };
}));

app.get("/auth/session", rotaAutenticada(async (req) => ({
  dados: { usuario: req.usuario },
})));

app.post("/auth/logout", rota(async (req, res) => {
  await encerrarSessao(req);
  limparCookieSessao(res);
  return { dados: { mensagem: "Sessão encerrada." } };
}));

app.post("/auth/reset-test", rota(async (req) => {
  const local = ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(req.socket.remoteAddress);
  const codigoConfigurado = process.env.TEST_RESET_CODE;
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_TEST_RESET !== "true" ||
      !local || !/^\d{4}$/.test(codigoConfigurado ?? "")) {
    const erro = new Error("Rota indisponível.");
    erro.status = 404;
    throw erro;
  }
  const { login, codigo, novaSenha } = req.body ?? {};
  if (typeof login !== "string" || !/^[a-zA-Z0-9._-]{3,80}$/.test(login) ||
      typeof novaSenha !== "string" || [...novaSenha].length < 12 ||
      Buffer.byteLength(novaSenha, "utf8") > 1024) {
    const erro = new Error("Informe um login e uma nova senha de pelo menos 12 caracteres.");
    erro.status = 400;
    throw erro;
  }
  if (codigo !== codigoConfigurado) {
    const erro = new Error("Código de teste inválido.");
    erro.status = 403;
    throw erro;
  }
  try {
    await redefinirSenhaAtendente(login, novaSenha, true);
  } catch (erro) {
    if (erro.code !== "ATENDENTE_NAO_ENCONTRADO") throw erro;
    erro.status = 404;
    erro.message = "Atendente ativo não encontrado.";
    throw erro;
  }
  return { dados: { mensagem: "Senha redefinida. Entre com a nova senha." } };
}));

app.get("/admin/resumo", rotaGestor(async () => ({ dados: await obterResumoDia() })));
app.get("/admin/usuarios", rotaGestor(async () => ({ dados: await listarUsuarios() })));
app.post("/admin/usuarios", rotaGestor(async (req) => ({
  status: 201, dados: await criarUsuario(req.body),
})));
app.post("/admin/usuarios/redefinir-senha", rotaGestor(async (req) => ({
  dados: await redefinirSenhaUsuario(req.body),
})));
app.get("/admin/fila", rotaGestor(async () => ({ dados: await obterOrdemFila() })));
app.put("/admin/fila", rotaGestor(async (req) => ({
  dados: await definirOrdemFila(req.body?.proximoNaoPrioritario),
})));

app.get("/senhas", rotaAutenticada(async () => ({ dados: await listarSenhas() })));

app.post("/senhas", rota(async (req) => ({
  status: 201,
  dados: await emitirSenha(req.body?.tipo),
})));

app.post("/atendimentos/proxima", rotaAutenticada(async (req) => ({
  dados: await chamarProxima(req.body?.guiche, req.usuario.nome),
})));

app.patch("/senhas/:numero/iniciar", rotaAutenticada(async (req) => ({
  dados: await iniciarAtendimento(req.params.numero),
})));

app.patch("/senhas/:numero/finalizar", rotaAutenticada(async (req) => ({
  dados: await finalizarAtendimento(req.params.numero),
})));

app.post("/senhas/:numero/chamar-novamente", rotaAutenticada(async (req) => ({
  dados: await chamarNovamente(req.params.numero),
})));

app.patch("/senhas/:numero/nao-compareceu", rotaAutenticada(async (req) => ({
  dados: await marcarNaoCompareceu(req.params.numero),
})));

app.get("/painel", rota(async () => ({ dados: await obterPainel() })));

let servidor;
let encerrando = false;

async function encerrar() {
  if (encerrando) return;
  encerrando = true;

  try {
    if (servidor?.listening) {
      await new Promise((resolve, reject) => {
        servidor.close((erro) => (erro ? reject(erro) : resolve()));
      });
    }
  } finally {
    await encerrarPool();
  }
}

function informarErro(erro) {
  console.error(`Falha no servidor (${erro.code || "ERRO_DESCONHECIDO"}).`);
  if (erro.code === "DB_CONFIG_INVALID") {
    console.error(erro.message);
  } else {
    console.error("Verifique o MySQL, as variáveis de ambiente e a porta HTTP.");
  }
}

async function iniciar() {
  try {
    await verificarConexao();
    if (encerrando) return;

    console.log("Conexão com o banco MySQL verificada.");
    await new Promise((resolve, reject) => {
      servidor = app.listen(PORT, (erro) => (erro ? reject(erro) : resolve()));
    });

    console.log(`Servidor rodando em http://localhost:${PORT}`);
  } catch (erro) {
    informarErro(erro);
    process.exitCode = 1;
    await encerrar();
  }
}

for (const sinal of ["SIGINT", "SIGTERM"]) {
  process.on(sinal, () => {
    encerrar().catch((erro) => {
      informarErro(erro);
      process.exitCode = 1;
    });
  });
}

iniciar().catch((erro) => {
  informarErro(erro);
  process.exitCode = 1;
});
