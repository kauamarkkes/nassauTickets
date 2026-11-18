import { useCallback, useEffect, useState } from "react";
import {
  obterSenhas,
  chamarProxima,
  iniciarAtendimento,
  finalizarAtendimento,
  chamarNovamente,
  marcarNaoCompareceu,
} from "../storage";
import { numeroFalado } from "../numeroFalado";
import Button from "../components/Button";
import Message from "../components/Message";
import TicketTypeBadge from "../components/TicketTypeBadge";
import "../styles/global.css";

const STATUS_ATIVOS = ["CHAMADA", "CHAMADA_NOVAMENTE", "EM_ATENDIMENTO"];

const NOMES_STATUS = {
  CHAMADA: "Chamada",
  CHAMADA_NOVAMENTE: "Chamada novamente",
  EM_ATENDIMENTO: "Em atendimento",
};

function dataHojeCurta() {
  const agora = new Date();
  const ano = String(agora.getFullYear()).slice(-2);
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}${mes}${dia}`;
}

function Attendant({ aoSessaoExpirada }) {
  const [guiche, setGuiche] = useState(1);
  const [senhas, setSenhas] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erroAtualizacao, setErroAtualizacao] = useState("");
  const [erroAudio, setErroAudio] = useState("");

  function anunciarChamada(senha) {
    try {
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        throw new Error("Este navegador não oferece áudio.");
      }
      const prefixo = senha.status === "CHAMADA_NOVAMENTE" ? "Última chamada. " : "";
      const fala = new SpeechSynthesisUtterance(`${prefixo}Senha ${numeroFalado(senha.numero)}. Guichê ${senha.guiche}.`);
      fala.lang = "pt-BR";
      fala.onerror = () => setErroAudio("A chamada foi registrada, mas o navegador não reproduziu o áudio.");
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(fala);
      setErroAudio("");
    } catch {
      setErroAudio("A chamada foi registrada, mas o áudio não pôde ser reproduzido neste navegador.");
    }

    if ("BroadcastChannel" in window) {
      const canal = new BroadcastChannel("nassauTickets-chamadas");
      canal.postMessage(senha.ordemChamada);
      canal.close();
    }
  }

  const atualizarSenhas = useCallback(async () => {
    try {
      const dados = await obterSenhas();
      setSenhas(dados);
      setErroAtualizacao("");
    } catch (error) {
      if (error.status === 401) {
        aoSessaoExpirada();
        return;
      }
      setErroAtualizacao(error.message);
    }
  }, [aoSessaoExpirada]);

  useEffect(() => {
    const inicial = setTimeout(atualizarSenhas, 0);
    const intervalo = setInterval(atualizarSenhas, 2000);
    return () => {
      clearTimeout(inicial);
      clearInterval(intervalo);
    };
  }, [atualizarSenhas]);

  const guicheValido = Number.isInteger(guiche) && guiche >= 1 && guiche <= 65535;

  const senhaAtual = senhas.find(
    (senha) => senha.guiche === guiche && STATUS_ATIVOS.includes(senha.status)
  );

  const hoje = dataHojeCurta();

  function contarNaFila(tipo) {
    return senhas.filter(
      (senha) =>
        senha.tipo === tipo &&
        senha.data === hoje &&
        ["EMITIDA", "AGUARDANDO"].includes(senha.status)
    ).length;
  }

  function mudarGuiche(evento) {
    const valor = evento.target.value;
    setGuiche(valor === "" ? NaN : Number(valor));
  }

  async function executar(acao, aoSucesso) {
    setErro("");
    setCarregando(true);

    try {
      const resultado = await acao();
      aoSucesso?.(resultado);
      await atualizarSenhas();
    } catch (error) {
      if (error.status === 401) {
        aoSessaoExpirada();
        return;
      }
      setErro(error.message);
      atualizarSenhas();
    } finally {
      setCarregando(false);
    }
  }

  function chamarProximaSenha() {
    if (!guicheValido) return;
    executar(() => chamarProxima(guiche), anunciarChamada);
  }

  function chamarNovamenteSenha() {
    if (!senhaAtual) return;
    executar(() => chamarNovamente(senhaAtual.numero), anunciarChamada);
  }

  function iniciar() {
    if (!senhaAtual) return;
    executar(() => iniciarAtendimento(senhaAtual.numero));
  }

  function finalizar() {
    if (!senhaAtual) return;
    executar(() => finalizarAtendimento(senhaAtual.numero));
  }

  function naoCompareceu() {
    if (!senhaAtual) return;
    executar(() => marcarNaoCompareceu(senhaAtual.numero));
  }

  const filas = [
    { tipo: "SP", nome: "Prioritárias" },
    { tipo: "SE", nome: "Exames" },
    { tipo: "SG", nome: "Gerais" },
  ];

  return (
    <main className="atd-page">
      <div className="atd-conteudo">
        <section className="atd-fila" aria-labelledby="fila-titulo">
          <h2 id="fila-titulo">Fila de atendimento</h2>

          <div className="atd-fila-itens">
            {filas.map(({ tipo, nome }) => (
              <div className="atd-fila-item" key={tipo}>
                <TicketTypeBadge tipo={tipo}>{nome}</TicketTypeBadge>
                <strong aria-label={`${nome}: ${contarNaFila(tipo)} na fila`}>
                  {String(contarNaFila(tipo)).padStart(2, "0")}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="atd-painel-direito" aria-label="Controle do guichê">
          <div className="atd-guiche">
            <label htmlFor="atd-guiche">Guichê</label>
            <input
              id="atd-guiche"
              type="number"
              min="1"
              max="65535"
              value={Number.isNaN(guiche) ? "" : guiche}
              onChange={mudarGuiche}
              aria-invalid={!guicheValido}
            />
          </div>
          {!guicheValido && (
            <Message tipo="error" className="atd-erro">
              Informe um número de guichê entre 1 e 65535.
            </Message>
          )}

          <div className="atd-senha-atual" aria-live="polite">
            <span className="atd-senha-label">Senha atual</span>

            {senhaAtual ? (
              <h1>
                {senhaAtual.numero}{" "}
                <span className="atd-status">
                  {NOMES_STATUS[senhaAtual.status] ?? senhaAtual.status}
                </span>
              </h1>
            ) : (
              <p className="atd-vazio">Nenhuma senha em atendimento</p>
            )}
          </div>

          <div className="atd-botoes">
            <Button
              variante="primary"
              onClick={chamarProximaSenha}
              disabled={carregando || !guicheValido || !!senhaAtual}
            >
              Chamar próxima
            </Button>

            <Button
              variante="secondary"
              onClick={chamarNovamenteSenha}
              disabled={
                carregando ||
                !senhaAtual ||
                senhaAtual.status !== "CHAMADA" ||
                senhaAtual.chamadas !== 1
              }
            >
              Chamar novamente
            </Button>

            <Button
              variante="secondary"
              onClick={iniciar}
              disabled={
                carregando ||
                !senhaAtual ||
                !["CHAMADA", "CHAMADA_NOVAMENTE"].includes(senhaAtual.status)
              }
            >
              Iniciar atendimento
            </Button>

            <Button
              variante="secondary"
              onClick={finalizar}
              disabled={
                carregando ||
                !senhaAtual ||
                senhaAtual.status !== "EM_ATENDIMENTO"
              }
            >
              Finalizar atendimento
            </Button>

            <Button
              variante="secondary"
              onClick={naoCompareceu}
              disabled={
                carregando ||
                !senhaAtual ||
                senhaAtual.status !== "CHAMADA_NOVAMENTE" ||
                senhaAtual.chamadas !== 2
              }
            >
              Não compareceu
            </Button>
          </div>

          {carregando && <Message tipo="info">Processando ação...</Message>}
          {erro && <Message tipo="error" className="atd-erro">{erro}</Message>}
          {erroAudio && <Message tipo="error" className="atd-erro">{erroAudio}</Message>}
          {erroAtualizacao && (
            <Message tipo="error" className="atd-erro">
              Não foi possível atualizar a fila: {erroAtualizacao}
            </Message>
          )}
        </section>
      </div>
    </main>
  );
}

export default Attendant;
