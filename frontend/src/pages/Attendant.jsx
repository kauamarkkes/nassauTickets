import { useEffect, useState } from "react";
import {
  obterSenhas,
  chamarProxima,
  iniciarAtendimento,
  finalizarAtendimento,
  chamarNovamente,
  marcarNaoCompareceu,
} from "../storage";
import "../styles/global.css";

const GUICHE_ATUAL = 1;
const ATENDENTE_ATUAL = "Atendente 01";

const STATUS_ATIVOS = [
  "CHAMADA",
  "CHAMADA_NOVAMENTE",
  "EM_ATENDIMENTO",
];

function Attendant() {
  const [senhas, setSenhas] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function atualizarSenhas() {
    try {
      const dados = await obterSenhas();
      setSenhas(dados);
      setErro("");
    } catch (error) {
      setErro(error.message);
    }
  }

  useEffect(() => {
    atualizarSenhas();

    const intervalo = setInterval(atualizarSenhas, 1000);

    return () => clearInterval(intervalo);
  }, []);

  const senhaAtual = senhas.find(
    (senha) =>
      senha.guiche === GUICHE_ATUAL &&
      STATUS_ATIVOS.includes(senha.status)
  );

  function contarNaFila(tipo) {
    return senhas.filter(
      (senha) =>
        senha.tipo === tipo &&
        ["EMITIDA", "AGUARDANDO"].includes(senha.status)
    ).length;
  }

  async function executar(acao) {
    setErro("");
    setCarregando(true);

    try {
      await acao();
      await atualizarSenhas();
    } catch (error) {
      console.error("Erro no atendimento:", error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function chamarProximaSenha() {
    executar(() =>
      chamarProxima(GUICHE_ATUAL, ATENDENTE_ATUAL)
    );
  }

  function chamarNovamenteSenha() {
    if (!senhaAtual) return;

    executar(() =>
      chamarNovamente(senhaAtual.numero)
    );
  }

  function iniciar() {
    if (!senhaAtual) return;

    executar(() =>
      iniciarAtendimento(senhaAtual.numero)
    );
  }

  function finalizar() {
    if (!senhaAtual) return;

    executar(() =>
      finalizarAtendimento(senhaAtual.numero)
    );
  }

  function naoCompareceu() {
    if (!senhaAtual) return;

    executar(() =>
      marcarNaoCompareceu(senhaAtual.numero)
    );
  }

  return (
    <div className="atd-page">
      <div className="atd-conteudo">

        <div className="atd-fila">
          <h2>Fila de atendimento</h2>

          <div className="atd-fila-itens">

            <div className="atd-fila-item">
              <span className="badge badge-sp">
                Prioritárias
              </span>

              <strong>
                {String(contarNaFila("SP")).padStart(2, "0")}
              </strong>
            </div>

            <div className="atd-fila-item">
              <span className="badge badge-se">
                Exames
              </span>

              <strong>
                {String(contarNaFila("SE")).padStart(2, "0")}
              </strong>
            </div>

            <div className="atd-fila-item">
              <span className="badge badge-sg">
                Gerais
              </span>

              <strong>
                {String(contarNaFila("SG")).padStart(2, "0")}
              </strong>
            </div>

          </div>
        </div>

        <div className="atd-painel-direito">

          <div className="atd-guiche">
            Guichê selecionado:{" "}
            <strong>Guichê {GUICHE_ATUAL}</strong>
          </div>

          <div className="atd-senha-atual">

            <span className="atd-senha-label">
              Senha atual
            </span>

            {senhaAtual ? (
              <h1>
                {senhaAtual.numero}{" "}

                <span className="atd-status">
                  {senhaAtual.status}
                </span>
              </h1>
            ) : (
              <p className="atd-vazio">
                Nenhuma senha em atendimento
              </p>
            )}

          </div>

          <div className="atd-botoes">

            <button
              className="btn-primary"
              onClick={chamarProximaSenha}
              disabled={carregando || !!senhaAtual}
            >
              Chamar próxima
            </button>

            <button
              className="btn-outline"
              onClick={iniciar}
              disabled={
                carregando ||
                !senhaAtual ||
                !["CHAMADA", "CHAMADA_NOVAMENTE"].includes(
                  senhaAtual.status
                )
              }
            >
              Iniciar atendimento
            </button>

            <button
              className="btn-outline"
              onClick={chamarNovamenteSenha}
              disabled={
                carregando ||
                !senhaAtual ||
                senhaAtual.status !== "CHAMADA" ||
                senhaAtual.chamadas !== 1
              }
            >
              Chamar novamente
            </button>

            <button
              className="btn-outline"
              onClick={finalizar}
              disabled={
                carregando ||
                !senhaAtual ||
                senhaAtual.status !== "EM_ATENDIMENTO"
              }
            >
              Finalizar atendimento
            </button>

            <button
              className="btn-outline"
              onClick={naoCompareceu}
              disabled={
                carregando ||
                !senhaAtual ||
                senhaAtual.status !== "CHAMADA_NOVAMENTE" ||
                senhaAtual.chamadas !== 2
              }
            >
              Não compareceu
            </button>

          </div>

          {erro && (
            <p role="alert">
              {erro}
            </p>
          )}

        </div>

      </div>
    </div>
  );
}

export default Attendant;