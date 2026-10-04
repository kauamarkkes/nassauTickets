import { useEffect, useState } from "react";
import "../styles/global.css";

const senhasIniciais = [
  { numero: "261002-SP001", tipo: "SP", status: "AGUARDANDO", guiche: null, chamadas: 0 },
  { numero: "261002-SE001", tipo: "SE", status: "AGUARDANDO", guiche: null, chamadas: 0 },
  { numero: "261002-SG001", tipo: "SG", status: "AGUARDANDO", guiche: null, chamadas: 0 },
  { numero: "261002-SP002", tipo: "SP", status: "AGUARDANDO", guiche: null, chamadas: 0 },
  { numero: "261002-SG002", tipo: "SG", status: "AGUARDANDO", guiche: null, chamadas: 0 },
];

const GUICHE_ATUAL = 1;

function Attendant() {
  const [senhas, setSenhas] = useState(() => {
  try {
    const salvas = JSON.parse(
      localStorage.getItem("nassauTickets:senhas") || "[]"
    );
    return Array.isArray(salvas) ? salvas : [];
  } catch {
    return [];
  }
});

  useEffect(() => {
    localStorage.setItem("nassauTickets:senhas", JSON.stringify(senhas));
  }, [senhas]);

  const senhaAtual = senhas.find(
    (s) => s.guiche === GUICHE_ATUAL && s.status !== "ATENDIDA" && s.status !== "NÃO_COMPARECEU"
  );

  function contarNaFila(tipo) {
    return senhas.filter((s) => s.tipo === tipo && s.status === "AGUARDANDO").length;
  }

  function proximaSenhaDaFila() {
    const prioridade = ["SP", "SE", "SG"];
    for (const tipo of prioridade) {
      const encontrada = senhas.find((s) => s.tipo === tipo && s.status === "AGUARDANDO");
      if (encontrada) return encontrada;
    }
    return null;
  }

  function proximaOrdemChamada() {
  return senhas.reduce(
    (maior, senha) => Math.max(maior, senha.ordemChamada ?? 0),
    0
  ) + 1;
}

  function chamarProxima() {
    if (senhaAtual) return;
    const proxima = proximaSenhaDaFila();
    if (!proxima) return;

    setSenhas((atuais) =>
      atuais.map((s) =>
        s.numero === proxima.numero
          ? {
            ...s,
            status: "CHAMADA",
            guiche: GUICHE_ATUAL,
            chamadas: 1,
            ordemChamada: proximaOrdemChamada(),
          }
          : s
      )
    );
  }

function chamarNovamente() {
  if (!senhaAtual) return;

  if (senhaAtual.chamadas >= 2) {
    setSenhas((atuais) =>
      atuais.map((s) =>
        s.numero === senhaAtual.numero
          ? { ...s, status: "NÃO_COMPARECEU" }
          : s
      )
    );
    return;
  }

  setSenhas((atuais) =>
    atuais.map((s) =>
      s.numero === senhaAtual.numero
        ? {
            ...s,
            status: "CHAMADA_NOVAMENTE",
            chamadas: s.chamadas + 1,
            ordemChamada: proximaOrdemChamada(),
          }
        : s
    )
  );
}

  function iniciarAtendimento() {
    if (!senhaAtual) return;
    setSenhas((atuais) =>
      atuais.map((s) =>
        s.numero === senhaAtual.numero ? { ...s, status: "EM_ATENDIMENTO" } : s
      )
    );
  }

  function finalizarAtendimento() {
    if (!senhaAtual) return;
    setSenhas((atuais) =>
      atuais.map((s) =>
        s.numero === senhaAtual.numero ? { ...s, status: "ATENDIDA" } : s
      )
    );
  }

  return (
    <div className="atd-page">

      <div className="atd-conteudo">
        <div className="atd-fila">
          <h2>Fila de atendimento</h2>
          <div className="atd-fila-itens">
            <div className="atd-fila-item">
              <span className="badge badge-sp">Prioritárias</span>
              <strong>{String(contarNaFila("SP")).padStart(2, "0")}</strong>
            </div>
            <div className="atd-fila-item">
              <span className="badge badge-se">Exames</span>
              <strong>{String(contarNaFila("SE")).padStart(2, "0")}</strong>
            </div>
            <div className="atd-fila-item">
              <span className="badge badge-sg">Gerais</span>
              <strong>{String(contarNaFila("SG")).padStart(2, "0")}</strong>
            </div>
          </div>
        </div>

        <div className="atd-painel-direito">
          <div className="atd-guiche">
            Guichê selecionado: <strong>Guichê {GUICHE_ATUAL}</strong>
          </div>

          <div className="atd-senha-atual">
            <span className="atd-senha-label">Senha atual</span>
            {senhaAtual ? (
              <h1>
                {senhaAtual.numero} <span className="atd-status">{senhaAtual.status}</span>
              </h1>
            ) : (
              <p className="atd-vazio">Nenhuma senha em atendimento</p>
            )}
          </div>

          <div className="atd-botoes">
            <button className="btn-primary" onClick={chamarProxima} disabled={!!senhaAtual}>
              Chamar próxima
            </button>
            <button
              className="btn-outline"
              onClick={iniciarAtendimento}
              disabled={!senhaAtual || senhaAtual.status === "EM_ATENDIMENTO"}
            >
              Iniciar atendimento
            </button>
            <button className="btn-outline" onClick={chamarNovamente} disabled={!senhaAtual}>
              Chamar novamente
            </button>
            <button
              className="btn-outline"
              onClick={finalizarAtendimento}
              disabled={!senhaAtual || senhaAtual.status !== "EM_ATENDIMENTO"}
            >
              Finalizar atendimento
            </button>
          </div>

          <p className="atd-nota">Ações registradas no histórico de atendimento.</p>
        </div>
      </div>
    </div>
  );
}

export default Attendant;