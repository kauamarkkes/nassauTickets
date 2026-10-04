import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const senhas = [];

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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});