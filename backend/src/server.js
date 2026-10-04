import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const senhas = [];
let ultimaFoiSP = false;
let proximoNaoSP = "SE";
let ordemChamada = 0;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ mensagem: "API nassauTickets funcionando" });
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

  const sequencia =
    senhas.filter((senha) => senha.tipo === tipo).length + 1;

  const novaSenha = {
    numero: `${String(sequencia).padStart(3, "0")}-${tipo}`,
    tipo,
    status: "AGUARDANDO",
    guiche: null,
    chamadas: 0,
  };

  senhas.push(novaSenha);
  return res.status(201).json(novaSenha);
});

app.post("/atendimentos/proxima", (req, res) => {
  const { guiche } = req.body;

  if (!Number.isInteger(guiche) || guiche < 1) {
    return res.status(400).json({ erro: "Informe um guichê válido." });
  }

  const ocupado = senhas.some(
    (senha) =>
      senha.guiche === guiche &&
      ["CHAMADA", "CHAMADA_NOVAMENTE", "EM_ATENDIMENTO"].includes(senha.status)
  );

  if (ocupado) {
    return res.status(409).json({ erro: "Este guichê já possui uma senha ativa." });
  }

  const aguardando = senhas.filter((senha) => senha.status === "AGUARDANDO");
  const sp = aguardando.find((senha) => senha.tipo === "SP");
  const se = aguardando.find((senha) => senha.tipo === "SE");
  const sg = aguardando.find((senha) => senha.tipo === "SG");

  let proxima;

  if (sp && !ultimaFoiSP) {
    proxima = sp;
  } else {
    proxima = proximoNaoSP === "SE" ? se ?? sg : sg ?? se;
    proxima ??= sp;
  }

  if (!proxima) {
    return res.status(404).json({ erro: "Não há senhas aguardando." });
  }

  proxima.status = "CHAMADA";
  proxima.guiche = guiche;
  proxima.chamadas = 1;
  proxima.ordemChamada = ++ordemChamada;

  ultimaFoiSP = proxima.tipo === "SP";
  if (!ultimaFoiSP) {
    proximoNaoSP = proxima.tipo === "SE" ? "SG" : "SE";
  }

  return res.json(proxima);
});

app.patch("/senhas/:numero/iniciar", (req, res) => {
  const senha = senhas.find(
    (item) => item.numero === req.params.numero
  );

  if (!senha) {
    return res.status(404).json({ erro: "Senha não encontrada." });
  }

  if (!["CHAMADA", "CHAMADA_NOVAMENTE"].includes(senha.status)) {
    return res.status(409).json({
      erro: "Esta senha não pode iniciar atendimento.",
    });
  }

  senha.status = "EM_ATENDIMENTO";
  return res.json(senha);
});

app.patch("/senhas/:numero/finalizar", (req, res) => {
  const senha = senhas.find(
    (item) => item.numero === req.params.numero
  );

  if (!senha) {
    return res.status(404).json({ erro: "Senha não encontrada." });
  }

  if (senha.status !== "EM_ATENDIMENTO") {
    return res.status(409).json({
      erro: "Inicie o atendimento antes de finalizar.",
    });
  }

  senha.status = "ATENDIDA";
  return res.json(senha);
});

app.get("/painel", (req, res) => {
  const ultimasCinco = senhas
    .filter((senha) => senha.ordemChamada > 0)
    .sort((a, b) => b.ordemChamada - a.ordemChamada)
    .slice(0, 5);

  return res.json({
    atual: ultimasCinco[0] ?? null,
    anteriores: ultimasCinco.slice(1),
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});