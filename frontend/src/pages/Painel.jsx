import { useEffect, useState } from "react";
import { obterPainel } from "../storage";
import "../styles/global.css";

const nomeTipo = {
  SP: "Prioritário",
  SE: "Exames",
  SG: "Geral",
};

function Painel() {
const [painel, setPainel] = useState({
  atual: null,
  anteriores: [],
});
const [carregandoInicial, setCarregandoInicial] = useState(true);
const [erro, setErro] = useState("");

async function atualizar() {
  try {
    const dados = await obterPainel();
    setPainel({
      atual: dados.atual,
      anteriores: dados.anteriores,
    });
    setErro("");
  } catch (error) {
    setErro(error.message);
  } finally {
    setCarregandoInicial(false);
  }
}

  async function atualizar() {
    try {
      const dados = await obterPainel();

      setChamadas([
        ...(dados.atual ? [dados.atual] : []),
        ...dados.anteriores,
      ]);
    } catch (error) {
      console.error("Erro ao atualizar painel:", error);
    }
  }

  useEffect(() => {
    atualizar();

    const intervalo = setInterval(atualizar, 1000);

    return () => clearInterval(intervalo);
  }, []);

  const atual = painel.atual;
const anteriores = painel.anteriores;

  return (
    <div className="painel-page">

      <div className="painel-conteudo">
      {erro && (
      <p role="alert">
       Não foi possível atualizar o painel: {erro}
      </p>
      )}
        <div className="chamada-atual">

          {atual ? (
            <>
              <span
                className={`badge badge-${atual.tipo.toLowerCase()}`}
              >
                Atendimento {nomeTipo[atual.tipo]}
              </span>

             <h1>
  {carregandoInicial
    ? "Carregando painel..."
    : erro
      ? "Painel indisponível"
      : "Aguardando chamada"}
</h1>

<p>
  {carregandoInicial
    ? "Consultando as chamadas."
    : erro
      ? "Aguardando a conexão com o servidor."
      : "Nenhuma senha foi chamada ainda."}
</p>
            </>
          ) : (
            <>
              <h1>
                Aguardando chamada
              </h1>

              <p>
                Nenhuma senha foi chamada ainda.
              </p>
            </>
          )}

        </div>

        <div className="ultimas-chamadas">

          <h2>
            Últimas chamadas
          </h2>

          {anteriores.length > 0 ? (
            anteriores.map((senha) => (
              <div
                className="chamada-linha"
                key={`${senha.numero}-${senha.ordemChamada}`}
              >
                <span>
                  {senha.numero}
                </span>

                <span
                  className={`badge badge-${senha.tipo.toLowerCase()}`}
                >
                  {nomeTipo[senha.tipo]}
                </span>

                <span className="chamada-guiche">
                  Guichê {senha.guiche}
                </span>
              </div>
            ))
          ) : (
            <p>
              Ainda não há chamadas anteriores.
            </p>
          )}

        </div>

      </div>

    </div>
  );
}

export default Painel;