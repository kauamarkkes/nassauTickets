import { useEffect, useRef, useState } from "react";
import { obterPainel } from "../storage";
import { numeroFalado } from "../numeroFalado";
import "../styles/global.css";

const nomeTipo = {
  SP: "Prioritário",
  SE: "Exames",
  SG: "Geral",
};

const painelDemo = {
  atual: { numero: "260819-SP001", tipo: "SP", guiche: 1, ordemChamada: 3 },
  anteriores: [
    { numero: "260819-SE001", tipo: "SE", guiche: 2, ordemChamada: 2 },
    { numero: "260819-SG001", tipo: "SG", guiche: 1, ordemChamada: 1 },
  ],
};

function classeTipo(tipo) {
  return `badge badge-${String(tipo).toLowerCase()}`;
}

function pararFala(falaAtual, inicioPendente) {
  clearTimeout(inicioPendente.current);
  if (falaAtual.current) {
    falaAtual.current.onerror = null;
    falaAtual.current.onend = null;
  }
  window.speechSynthesis?.cancel();
}

function falar(texto, falaAtual, inicioPendente, informarErro) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    informarErro("Este navegador não oferece áudio de chamadas.");
    return;
  }
  pararFala(falaAtual, inicioPendente);
  const fala = new SpeechSynthesisUtterance(texto);
  falaAtual.current = fala;
  fala.lang = "pt-BR";
  fala.voice = window.speechSynthesis.getVoices().find((voz) => voz.lang.toLowerCase() === "pt-br") ?? null;
  fala.onstart = () => informarErro("");
  fala.onerror = () => informarErro("Não foi possível reproduzir a voz. Verifique o som e clique em Ativar som.");
  fala.onend = () => { if (falaAtual.current === fala) falaAtual.current = null; };
  inicioPendente.current = setTimeout(() => window.speechSynthesis.speak(fala), 100);
}

function Painel() {
  const [painel, setPainel] = useState({ atual: null, anteriores: [] });
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [erro, setErro] = useState("");
  const [modoDemo, setModoDemo] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [somAtivo, setSomAtivo] = useState(false);
  const [erroAudio, setErroAudio] = useState("");
  const somAtivoRef = useRef(false);
  const primeiraConsulta = useRef(true);
  const ultimaOrdem = useRef(0);
  const falaAtual = useRef(null);
  const inicioPendente = useRef(null);

  useEffect(() => {
    let ativo = true;

    async function atualizar() {
      try {
        const dados = await obterPainel();
        if (!ativo) return;
        const ordem = dados.atual?.ordemChamada ?? 0;
        if (primeiraConsulta.current) {
          primeiraConsulta.current = false;
        } else if (somAtivoRef.current && ordem !== ultimaOrdem.current && dados.atual) {
          const senha = dados.atual;
          const prefixo = senha.status === "CHAMADA_NOVAMENTE" ? "Última chamada. " : "";
          falar(`${prefixo}Senha ${numeroFalado(senha.numero)}. Guichê ${senha.guiche}.`, falaAtual, inicioPendente, setErroAudio);
        }
        ultimaOrdem.current = ordem;
        setPainel({
          atual: dados.atual ?? null,
          anteriores: Array.isArray(dados.anteriores) ? dados.anteriores : [],
        });
        setErro("");
        setModoDemo(false);
      } catch (falha) {
        if (ativo) setErro(falha.message);
      } finally {
        if (ativo) setCarregandoInicial(false);
      }
    }

    const inicial = setTimeout(atualizar, 0);
    const intervalo = setInterval(atualizar, 2000);
    const canal = "BroadcastChannel" in window ? new BroadcastChannel("nassauTickets-chamadas") : null;
    if (canal) canal.onmessage = atualizar;
    return () => {
      ativo = false;
      clearTimeout(inicial);
      clearInterval(intervalo);
      canal?.close();
      pararFala(falaAtual, inicioPendente);
    };
  }, [tentativa]);

  const { atual, anteriores } = modoDemo && erro ? painelDemo : painel;

  return (
    <main className="painel-page">
      <div className="painel-conteudo">
        {!somAtivo && <button type="button" className="btn-outline" onClick={() => {
          somAtivoRef.current = true;
          setSomAtivo(true);
          setErroAudio("");
          falar("Áudio do painel ativado.", falaAtual, inicioPendente, setErroAudio);
        }}>
          Ativar som das chamadas
        </button>}
        {erroAudio && <p role="alert">{erroAudio}</p>}
        {erro && (
          <p role="alert" className="chamada-erro">
            Não foi possível atualizar o painel: {erro}
          </p>
        )}
        {erro && (
          <div>
            <button type="button" className="btn-outline" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</button>
            <button type="button" className="btn-outline" onClick={() => setModoDemo(true)}>Ver demonstração</button>
          </div>
        )}
        {modoDemo && erro && <p role="status">Dados locais de demonstração. Não são chamadas reais.</p>}

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
                {carregandoInicial ? "Carregando painel..." : erro ? "Painel indisponível" : "Aguardando chamada"}
              </h1>
              <p>
                {carregandoInicial
                  ? "Consultando as chamadas."
                  : erro ? "Aguardando a conexão com o servidor." : "Nenhuma senha foi chamada ainda."}
              </p>
            </>
          )}
        </section>

        <section className="ultimas-chamadas" aria-labelledby="ultimas-titulo">
          <h2 id="ultimas-titulo">Últimas chamadas</h2>

          {anteriores.length > 0 ? (
            <ul className="chamadas-lista">
              {anteriores.slice(0, 4).map((senha) => (
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
