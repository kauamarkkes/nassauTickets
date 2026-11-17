import { useEffect, useState } from "react";
import { obterPainel } from "../storage";
import "../styles/global.css";

const nomeTipo = {
  SP: "Prioritário",
  SE: "Exames",
  SG: "Geral",
};

function classeTipo(tipo) {
  return `badge badge-${String(tipo).toLowerCase()}`;
}

function Painel() {
  const [painel, setPainel] = useState({ atual: null, anteriores: [] });
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function atualizar() {
      try {
        const dados = await obterPainel();
        if (!ativo) return;
        setPainel({
          atual: dados.atual ?? null,
          anteriores: Array.isArray(dados.anteriores) ? dados.anteriores : [],
        });
        setErro("");
      } catch (falha) {
        if (ativo) setErro(falha.message);
      } finally {
        if (ativo) setCarregandoInicial(false);
      }
    }

    const inicial = setTimeout(atualizar, 0);
    const intervalo = setInterval(atualizar, 2000);
    return () => {
      ativo = false;
      clearTimeout(inicial);
      clearInterval(intervalo);
    };
  }, []);

  const { atual, anteriores } = painel;

  return (
    <main className="painel-page">
      <div className="painel-conteudo">
        {erro && (
          <p role="alert" className="chamada-erro">
            Não foi possível atualizar o painel: {erro}
          </p>
        )}

        <section
          className="chamada-atual"
          aria-label="Senha chamada"
          aria-live="polite"
        >
          {atual ? (
            <>
              <span className={classeTipo(atual.tipo)}>
                Atendimento {nomeTipo[atual.tipo] ?? atual.tipo}
              </span>
              <h1 className="painel-numero">{atual.numero}</h1>
              <p className="painel-guiche">Guichê {atual.guiche}</p>
            </>
          ) : (
            <>
              <h1>
                {carregandoInicial ? "Carregando painel..." : "Aguardando chamada"}
              </h1>
              <p>
                {carregandoInicial
                  ? "Consultando as chamadas."
                  : "Nenhuma senha foi chamada ainda."}
              </p>
            </>
          )}
        </section>

        <section className="ultimas-chamadas" aria-labelledby="ultimas-titulo">
          <h2 id="ultimas-titulo">Últimas chamadas</h2>

          {anteriores.length > 0 ? (
            <ul className="chamadas-lista">
              {anteriores.slice(0, 5).map((senha) => (
                <li
                  className="chamada-linha"
                  key={`${senha.numero}-${senha.ordemChamada}`}
                >
                  <span>{senha.numero}</span>
                  <span className={classeTipo(senha.tipo)}>
                    {nomeTipo[senha.tipo] ?? senha.tipo}
                  </span>
                  <span className="chamada-guiche">Guichê {senha.guiche}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Ainda não há chamadas anteriores.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export default Painel;