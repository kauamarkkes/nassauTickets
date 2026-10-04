import { useEffect, useState } from "react";
import "../styles/global.css";

const CHAVE = "nassauTickets:senhas";
const nomeTipo = { SP: "Prioritário", SE: "Exames", SG: "Geral" };

function lerChamadas() {
  try {
    const senhas = JSON.parse(localStorage.getItem(CHAVE) || "[]");

    if (!Array.isArray(senhas)) return [];

    return senhas
      .filter((senha) => senha.ordemChamada > 0)
      .sort((a, b) => b.ordemChamada - a.ordemChamada)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function Painel() {
  const [chamadas, setChamadas] = useState(lerChamadas);

  useEffect(() => {
    function atualizar(evento) {
      if (evento.key === CHAVE) {
        setChamadas(lerChamadas());
      }
    }

    window.addEventListener("storage", atualizar);
    return () => window.removeEventListener("storage", atualizar);
  }, []);

  const atual = chamadas[0];
  const anteriores = chamadas.slice(1);

  return (
    <div className="painel-page">
      <div className="painel-conteudo">
        <div className="chamada-atual">
          {atual ? (
            <>
              <span className={`badge badge-${atual.tipo.toLowerCase()}`}>
                Atendimento {nomeTipo[atual.tipo]}
              </span>
              <h1>{atual.numero}</h1>
              <p>Dirija-se ao Guichê {atual.guiche}</p>
            </>
          ) : (
            <>
              <h1>Aguardando chamada</h1>
              <p>Nenhuma senha foi chamada ainda.</p>
            </>
          )}
        </div>

        <div className="ultimas-chamadas">
          <h2>Últimas chamadas</h2>

          {anteriores.map((senha) => (
            <div className="chamada-linha" key={senha.ordemChamada}>
              <span>{senha.numero}</span>
              <span className={`badge badge-${senha.tipo.toLowerCase()}`}>
                {nomeTipo[senha.tipo]}
              </span>
              <span className="chamada-guiche">
                Guichê {senha.guiche}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Painel;