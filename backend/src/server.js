import express from "express";
import cors from "cors";
import { verificarConexao, encerrarPool } from "./db.js";
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

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

function rota(operacao) {
  return async (req, res) => {
    try {
      const { status = 200, dados } = await operacao(req);
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

app.get("/", (_req, res) => {
  res.json({ mensagem: "API nassauTickets funcionando" });
});

app.get("/senhas", rota(async () => ({ dados: await listarSenhas() })));

app.post("/senhas", rota(async (req) => ({
  status: 201,
  dados: await emitirSenha(req.body?.tipo),
})));

app.post("/atendimentos/proxima", rota(async (req) => ({
  dados: await chamarProxima(req.body?.guiche, req.body?.atendente ?? "Atendente 01"),
})));

app.patch("/senhas/:numero/iniciar", rota(async (req) => ({
  dados: await iniciarAtendimento(req.params.numero),
})));

app.patch("/senhas/:numero/finalizar", rota(async (req) => ({
  dados: await finalizarAtendimento(req.params.numero),
})));

app.post("/senhas/:numero/chamar-novamente", rota(async (req) => ({
  dados: await chamarNovamente(req.params.numero),
})));

app.patch("/senhas/:numero/nao-compareceu", rota(async (req) => ({
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
