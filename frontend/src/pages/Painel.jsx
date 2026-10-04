import { useState } from "react";
import "../styles/global.css";

const senhasChamadasMock = [
  { numero: "261002-SG001", tipo: "SG", guiche: 1 },
  { numero: "261002-SE001", tipo: "SE", guiche: 2 },
  { numero: "261002-SP001", tipo: "SP", guiche: 1 },
];

const nomeTipo = { SP: "Prioritário", SE: "Exames", SG: "Geral" };

function Painel() {
  const [senhasChamadas] = useState(senhasChamadasMock);

  const ultimasCinco = senhasChamadas.slice(-5);
  const chamadaAtual = ultimasCinco[ultimasCinco.length - 1];
  const anteriores = ultimasCinco.slice(0, -1).reverse();

  return (
    <div className="painel-page">

      <div className="painel-conteudo">
        {chamadaAtual && (
          <div className="chamada-atual">
            <span className={`badge badge-${chamadaAtual.tipo.toLowerCase()}`}>
              Atendimento {nomeTipo[chamadaAtual.tipo]}
            </span>
            <h1>{chamadaAtual.numero}</h1>
            <p>Dirija-se ao Guichê {chamadaAtual.guiche}</p>
          </div>
        )}

        <div className="ultimas-chamadas">
          <h2>Últimas chamadas</h2>
          {anteriores.map((s) => (
            <div className="chamada-linha" key={s.numero}>
              <span>{s.numero}</span>
              <span className={`badge badge-${s.tipo.toLowerCase()}`}>
                {nomeTipo[s.tipo]}
              </span>
              <span className="chamada-guiche">Guichê {s.guiche}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Painel;