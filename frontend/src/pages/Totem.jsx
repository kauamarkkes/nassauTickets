import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Message from "../components/Message";

const CHAVE = "nassauTickets:senhas";

const tipos = [
  { sigla: "SP", titulo: "Prioritário", descricao: "Atendimento preferencial" },
  { sigla: "SG", titulo: "Geral", descricao: "Atendimento comum" },
  { sigla: "SE", titulo: "Exames", descricao: "Retirada de exames" },
];

function lerSenhas() {
  try {
    const senhas = JSON.parse(localStorage.getItem(CHAVE) || "[]");
    return Array.isArray(senhas) ? senhas : [];
  } catch {
    return [];
  }
}

export default function Totem() {
  const [senhaEmitida, setSenhaEmitida] = useState(
    () => lerSenhas().at(-1) ?? null
  );
  const [erro, setErro] = useState("");

  function emitir(tipo) {
    setErro("");

    try {
      const senhas = lerSenhas();
      const sequencia = senhas.filter((senha) => senha.tipo === tipo).length + 1;
      const numero = `${String(sequencia).padStart(3, "0")}-${tipo}`;
      const novaSenha = {
        id: crypto.randomUUID(),
        numero,
        tipo,
        status: "AGUARDANDO",
        guiche: null,
        chamadas: 0,
      };

      localStorage.setItem(CHAVE, JSON.stringify([...senhas, novaSenha]));
      setSenhaEmitida(novaSenha);
    } catch {
      setErro("Não foi possível emitir a senha. Tente novamente.");
    }
  }

  return (
    <div className="nt-container">
      <h1>Retirar senha</h1>
      <p>Escolha o tipo de atendimento:</p>

      <div className="nt-grid">
        {tipos.map(({ sigla, titulo, descricao }) => (
          <Card
            key={sigla}
            sigla={sigla}
            titulo={titulo}
            descricao={descricao}
            rodape={<Button onClick={() => emitir(sigla)}>Emitir senha</Button>}
          />
        ))}
      </div>

      {erro && <Message tipo="error">{erro}</Message>}
      {senhaEmitida && (
        <Message tipo="success" titulo="Senha emitida">
          Sua senha é {senhaEmitida.numero}. Aguarde a chamada.
        </Message>
      )}
    </div>
  );
}