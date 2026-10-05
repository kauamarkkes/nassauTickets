import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "senhas.json");

function dadosIniciais() {
  return {
    senhas: [],
    config: {
      ultimaFoiSP: false,
      proximoNaoSP: "SE",
      ordemChamada: 0,
    },
  };
}

function garantirArquivo() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(dadosIniciais(), null, 2),
      "utf-8"
    );
  }
}

function carregarDados() {
  garantirArquivo();

  try {
    const conteudo = fs.readFileSync(DATA_FILE, "utf-8");

    if (!conteudo.trim()) {
      return dadosIniciais();
    }

    return JSON.parse(conteudo);
  } catch (error) {
    console.error("Erro ao carregar senhas.json:", error);

    return dadosIniciais();
  }
}

function salvarDados() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(dados, null, 2),
    "utf-8"
  );
}

const dados = carregarDados();
const senhas = dados.senhas;
const config = dados.config;
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());
function dataAtual() {
  const agora = new Date();

  const ano = String(agora.getFullYear()).slice(-2);
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}${mes}${dia}`;
}

function dataHoraAtual() {
  return new Date().toISOString();
}

function proximoNumero(tipo) {
  const hoje = dataAtual();

  const quantidade = senhas.filter(
    (senha) =>
      senha.data === hoje &&
      senha.tipo === tipo
  ).length;

  return String(quantidade + 1).padStart(3, "0");
}

app.get("/", (req, res) => {
  res.json({
    mensagem: "API nassauTickets funcionando",
  });
});

app.get("/senhas", (req, res) => {
  res.json(senhas);
});

app.post("/senhas", (req, res) => {
  const { tipo } = req.body;

  if (!["SP", "SG", "SE"].includes(tipo)) {
    return res.status(400).json({
      erro: "Escolha SP, SG ou SE.",
    });
  }

  const hoje = dataAtual();
  const sequencia = proximoNumero(tipo);
  const novaSenha = {
    numero: `${hoje}-${tipo}${sequencia}`,
    tipo,
    status: "AGUARDANDO",
    data: hoje,
    dataHoraEmissao: dataHoraAtual(),
    guiche: null,
    atendente: null,
    chamadas: 0,
    primeiraChamada: null,
    segundaChamada: null,
    inicioAtendimento: null,
    finalizacao: null,
    ordemChamada: 0,
  };

  senhas.push(novaSenha);
  salvarDados();

  return res.status(201).json(novaSenha);
});

app.post("/atendimentos/proxima", (req, res) => {
  const {
    guiche,
    atendente = "Atendente 01",
  } = req.body;

  if (!Number.isInteger(guiche) || guiche < 1) {
    return res.status(400).json({
      erro: "Informe um guichê válido.",
    });
  }

  const ocupado = senhas.some(
    (senha) =>
      senha.guiche === guiche &&
      [
        "CHAMADA",
        "CHAMADA_NOVAMENTE",
        "EM_ATENDIMENTO",
      ].includes(senha.status)
  );

  if (ocupado) {
    return res.status(409).json({
      erro: "Este guichê já possui uma senha ativa.",
    });
  }

  const aguardando = senhas.filter(
    (senha) =>
      senha.data === dataAtual() &&
      senha.status === "AGUARDANDO"
  );

  const sp = aguardando.find(
    (senha) => senha.tipo === "SP"
  );

  const se = aguardando.find(
    (senha) => senha.tipo === "SE"
  );

  const sg = aguardando.find(
    (senha) => senha.tipo === "SG"
  );

  let proxima = null;

  if (sp && !config.ultimaFoiSP) {
    proxima = sp;
  } else {
    if (config.proximoNaoSP === "SE") {
      proxima = se ?? sg;
    } else {
      proxima = sg ?? se;
    }

    proxima ??= sp;
  }

  if (!proxima) {
    return res.status(404).json({
      erro: "Não há senhas aguardando.",
    });
  }

  const agora = dataHoraAtual();

  config.ordemChamada++;

  proxima.status = "CHAMADA";
  proxima.guiche = guiche;
  proxima.atendente = atendente;
  proxima.chamadas = 1;
  proxima.primeiraChamada = agora;
  proxima.ordemChamada = config.ordemChamada;

  config.ultimaFoiSP = proxima.tipo === "SP";

  if (!config.ultimaFoiSP) {
    config.proximoNaoSP =
      proxima.tipo === "SE"
        ? "SG"
        : "SE";
  }

  salvarDados();

  return res.json(proxima);
});

app.patch(
  "/senhas/:numero/iniciar",
  (req, res) => {
    const senha = senhas.find(
      (item) => item.numero === req.params.numero
    );

    if (!senha) {
      return res.status(404).json({
        erro: "Senha não encontrada.",
      });
    }

    if (
      ![
        "CHAMADA",
        "CHAMADA_NOVAMENTE",
      ].includes(senha.status)
    ) {
      return res.status(409).json({
        erro:
          "Esta senha não pode iniciar atendimento.",
      });
    }

    senha.status = "EM_ATENDIMENTO";
    senha.inicioAtendimento =
      dataHoraAtual();
      salvarDados();

    return res.json(senha);
  }
);

app.patch(
  "/senhas/:numero/finalizar",
  (req, res) => {
    const senha = senhas.find(
      (item) => item.numero === req.params.numero
    );

    if (!senha) {
      return res.status(404).json({
        erro: "Senha não encontrada.",
      });
    }

    if (senha.status !== "EM_ATENDIMENTO") {
      return res.status(409).json({
        erro:
          "Inicie o atendimento antes de finalizar.",
      });
    }

    senha.status = "ATENDIDA";
    senha.finalizacao = dataHoraAtual();
    salvarDados();
    return res.json(senha);
  }
);

app.post(
  "/senhas/:numero/chamar-novamente",
  (req, res) => {
    const senha = senhas.find(
      (item) => item.numero === req.params.numero
    );

    if (!senha) {
      return res.status(404).json({
        erro: "Senha não encontrada.",
      });
    }

    if (
      senha.status !== "CHAMADA" ||
      senha.chamadas !== 1
    ) {
      return res.status(409).json({
        erro:
          "Esta senha não pode ser chamada novamente.",
      });
    }

    senha.status = "CHAMADA_NOVAMENTE";
    senha.chamadas = 2;
    senha.segundaChamada =
      dataHoraAtual();

    config.ordemChamada++;
    senha.ordemChamada =
      config.ordemChamada;
    salvarDados();
    return res.json(senha);
  }
);

app.patch(
  "/senhas/:numero/nao-compareceu",
  (req, res) => {
    const senha = senhas.find(
      (item) => item.numero === req.params.numero
    );

    if (!senha) {
      return res.status(404).json({
        erro: "Senha não encontrada.",
      });
    }

    if (
      senha.status !== "CHAMADA_NOVAMENTE" ||
      senha.chamadas !== 2
    ) {
      return res.status(409).json({
        erro:
          "A senha precisa ter sido chamada duas vezes.",
      });
    }

    senha.status = "NÃO_COMPARECEU";
    senha.finalizacao =
      dataHoraAtual();
      salvarDados();

    return res.json(senha);
  }
);

app.get("/painel", (req, res) => {
  const ultimasCinco = senhas
    .filter(
      (senha) => senha.ordemChamada > 0
    )
    .sort(
      (a, b) =>
        b.ordemChamada -
        a.ordemChamada
    )
    .slice(0, 5);

  return res.json({
    atual: ultimasCinco[0] ?? null,
    anteriores:
      ultimasCinco.slice(1),
  });
});

app.listen(PORT, () => {
  console.log(
    `Servidor rodando em http://localhost:${PORT}`
  );

  console.log(
    `Dados salvos em: ${DATA_FILE}`
  );
});