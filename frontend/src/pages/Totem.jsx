import { useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import Message from "../components/Message";
import { emitirSenha } from "../storage";

const tipos = [
  {
    sigla: "SP",
    titulo: "Prioritário",
    descricao: "Atendimento preferencial",
  },
  {
    sigla: "SG",
    titulo: "Geral",
    descricao: "Atendimento comum",
  },
  {
    sigla: "SE",
    titulo: "Exames",
    descricao: "Retirada de exames",
  },
];

export default function Totem() {
  const [senhaEmitida, setSenhaEmitida] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function emitir(tipo) {
    if (carregando) return;

    setErro("");
    setCarregando(true);

    try {
      const novaSenha = await emitirSenha(tipo);

      setSenhaEmitida(novaSenha);
    } catch (error) {
      console.error("Erro ao emitir senha:", error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="nt-container">
      <h1>Retirar senha</h1>

      <p>Escolha o tipo de atendimento:</p>

      <div className="nt-grid">
        {tipos.map(
          ({ sigla, titulo, descricao }) => (
            <Card
              key={sigla}
              sigla={sigla}
              titulo={titulo}
              descricao={descricao}
              rodape={
                <Button
                  onClick={() => emitir(sigla)}
                >
                  Emitir senha
                </Button>
              }
            />
          )
        )}
      </div>

      {carregando && (
        <p role="status">
          Emitindo senha...
        </p>
      )}

      {erro && (
        <Message tipo="error">
          {erro}
        </Message>
      )}

      {senhaEmitida && (
        <Message
          tipo="success"
          titulo="Senha emitida"
        >
          Sua senha é{" "}
          <strong>{senhaEmitida.numero}</strong>.
          Aguarde a chamada.
        </Message>
      )}
    </div>
  );
}