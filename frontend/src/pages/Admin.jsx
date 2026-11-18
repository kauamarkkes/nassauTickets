import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../api";
import "../styles/global.css";

const nomesStatus = {
  EMITIDA: "Emitidas", AGUARDANDO: "Aguardando", CHAMADA: "Chamadas",
  CHAMADA_NOVAMENTE: "Chamadas novamente", EM_ATENDIMENTO: "Em atendimento",
  ATENDIDA: "Atendidas", "NÃO_COMPARECEU": "Não compareceram",
};
const nomesTipo = { SP: "Prioritária", SG: "Geral", SE: "Exames" };

function dataHoje() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
}

function mostrarData(valor) {
  return `${valor.slice(8, 10)}/${valor.slice(5, 7)}/${valor.slice(0, 4)}`;
}

function GraficoBarras({ dados, vazio }) {
  const maior = Math.max(1, ...dados.map((item) => item.quantidade));
  if (dados.length === 0) return <p className="admin-vazio">{vazio}</p>;
  return <ul className="admin-grafico">
    {dados.map((item) => (
      <li key={item.chave}>
        <div className="admin-grafico-legenda"><span>{item.nome}</span><strong>{item.quantidade}</strong></div>
        <div className="admin-grafico-trilho" aria-hidden="true">
          <span style={{ width: `${(item.quantidade / maior) * 100}%` }} />
        </div>
      </li>
    ))}
  </ul>;
}

function caminhoResumo(filtros) {
  const parametros = new URLSearchParams(filtros);
  return `/admin/resumo?${parametros}`;
}

export default function Admin({ aoSessaoExpirada }) {
  const [filtros, setFiltros] = useState(() => ({
    inicio: dataHoje(), fim: dataHoje(), tipo: "", status: "", guiche: "",
  }));
  const filtrosAplicados = useRef(filtros);
  const [resumo, setResumo] = useState(null);
  const [relatorio, setRelatorio] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [ordem, setOrdem] = useState("SE");
  const [novo, setNovo] = useState({ login: "", nome: "", perfil: "ATENDENTE", senha: "" });
  const [redefinicao, setRedefinicao] = useState({ login: "", novaSenha: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const tratarFalha = useCallback((falha) => {
    if (falha.status === 401) {
      aoSessaoExpirada();
      return;
    }
    setErro(falha.message);
  }, [aoSessaoExpirada]);

  async function atualizar() {
    const [dadosResumo, dadosUsuarios, dadosFila] = await Promise.all([
      apiRequest(caminhoResumo(filtrosAplicados.current)), apiRequest("/admin/usuarios"), apiRequest("/admin/fila"),
    ]);
    setResumo(dadosResumo);
    setUsuarios(dadosUsuarios);
    setOrdem(dadosFila.proximoNaoPrioritario);
  }

  useEffect(() => {
    let ativo = true;
    Promise.all([
      apiRequest(caminhoResumo(filtrosAplicados.current)), apiRequest("/admin/usuarios"), apiRequest("/admin/fila"),
    ]).then(([dadosResumo, dadosUsuarios, dadosFila]) => {
      if (!ativo) return;
      setResumo(dadosResumo);
      setUsuarios(dadosUsuarios);
      setOrdem(dadosFila.proximoNaoPrioritario);
    }).catch((falha) => { if (ativo) tratarFalha(falha); })
      .finally(() => { if (ativo) setCarregando(false); });
    const intervalo = setInterval(async () => {
      const aplicados = filtrosAplicados.current;
      try {
        const dados = await apiRequest(caminhoResumo(aplicados));
        if (ativo && aplicados === filtrosAplicados.current) setResumo(dados);
      } catch (falha) {
        if (ativo) tratarFalha(falha);
      }
    }, 10000);
    return () => { ativo = false; clearInterval(intervalo); };
  }, [tratarFalha]);

  async function executar(operacao, sucesso) {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await operacao();
      await atualizar();
      setMensagem(sucesso);
    } catch (falha) {
      tratarFalha(falha);
    } finally {
      setSalvando(false);
    }
  }

  async function atualizarManual() {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await atualizar();
      setMensagem("Dados atualizados.");
    } catch (falha) {
      tratarFalha(falha);
    } finally {
      setSalvando(false);
    }
  }

  async function aplicarFiltros(evento) {
    evento.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      const dados = await apiRequest(caminhoResumo(filtros));
      filtrosAplicados.current = { ...filtros };
      setResumo(dados);
      setRelatorio(null);
    } catch (falha) {
      tratarFalha(falha);
    } finally {
      setSalvando(false);
    }
  }

  async function carregarRelatorio() {
    setSalvando(true);
    setErro("");
    try {
      setRelatorio(await apiRequest(caminhoResumo(filtrosAplicados.current).replace("/admin/resumo", "/admin/relatorio")));
    } catch (falha) {
      tratarFalha(falha);
    } finally {
      setSalvando(false);
    }
  }

  function cadastrar(evento) {
    evento.preventDefault();
    executar(async () => {
      await apiRequest("/admin/usuarios", { method: "POST", body: JSON.stringify(novo) });
      setNovo({ login: "", nome: "", perfil: "ATENDENTE", senha: "" });
    }, "Usuário cadastrado.");
  }

  function redefinir(evento) {
    evento.preventDefault();
    executar(async () => {
      await apiRequest("/admin/usuarios/redefinir-senha", {
        method: "POST", body: JSON.stringify(redefinicao),
      });
      setRedefinicao({ login: "", novaSenha: "" });
    }, "Senha redefinida. As sessões anteriores foram encerradas.");
  }

  function salvarFila(evento) {
    evento.preventDefault();
    executar(() => apiRequest("/admin/fila", {
      method: "PUT", body: JSON.stringify({ proximoNaoPrioritario: ordem }),
    }), "Ordem da fila atualizada.");
  }

  const dataResumo = resumo?.inicio
    ? resumo.inicio === resumo.fim ? mostrarData(resumo.inicio) : `${mostrarData(resumo.inicio)} a ${mostrarData(resumo.fim)}`
    : "Hoje";
  const dadosTipo = resumo ? Object.entries(resumo.porTipo).map(([chave, quantidade]) => ({
    chave, nome: `${nomesTipo[chave] ?? chave} (${chave})`, quantidade,
  })) : [];
  const dadosStatus = resumo ? Object.entries(nomesStatus).map(([chave, nome]) => ({
    chave, nome, quantidade: resumo.porStatus[chave] ?? 0,
  })) : [];
  const dadosDias = resumo ? resumo.porDia.map(({ data, quantidade }) => ({
    chave: data, nome: `${data.slice(4, 6)}/${data.slice(2, 4)}`, quantidade,
  })) : [];

  return (
    <main className="nt-container admin-page">
      <header className="admin-intro">
        <div>
          <span className="admin-sobretitulo">ÁREA DO GESTOR</span>
          <h1>Visão do atendimento</h1>
          <p>Filtre os resultados, acompanhe a operação e organize os acessos da equipe.</p>
        </div>
        <div className="admin-data"><span>REFERÊNCIA</span><strong>{dataResumo}</strong></div>
      </header>
      {erro && <p role="alert" className="admin-aviso admin-alerta">{erro}</p>}
      {mensagem && <p role="status" className="admin-aviso admin-sucesso">{mensagem}</p>}
      <form className="admin-secao admin-filtros" onSubmit={aplicarFiltros} aria-label="Filtros do painel">
        <div className="admin-secao-cabecalho"><div><span className="admin-sobretitulo">CONSULTA</span><h2>Filtrar indicadores</h2></div></div>
        <div className="admin-filtros-grade">
          <label>De <input type="date" value={filtros.inicio} onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })} required /></label>
          <label>Até <input type="date" min={filtros.inicio} value={filtros.fim} onChange={(e) => setFiltros({ ...filtros, fim: e.target.value })} required /></label>
          <label>Tipo <select value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}><option value="">Todos</option><option value="SP">Prioritária (SP)</option><option value="SG">Geral (SG)</option><option value="SE">Exames (SE)</option></select></label>
          <label>Situação <select value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}><option value="">Todas</option>{Object.entries(nomesStatus).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}</select></label>
          <label>Guichê <input type="number" min="1" max="65535" value={filtros.guiche} onChange={(e) => setFiltros({ ...filtros, guiche: e.target.value })} placeholder="Todos" /></label>
          <button type="submit" disabled={salvando}>Aplicar filtros</button>
        </div>
      </form>
      {carregando ? <p role="status" className="admin-carregando">Carregando informações do dia...</p> : (
        <>
          <section aria-labelledby="resumo-titulo">
            <div className="admin-secao-cabecalho">
              <div><span className="admin-sobretitulo">OPERAÇÃO</span><h2 id="resumo-titulo">Resumo do período</h2></div>
              <button type="button" className="admin-botao-secundario" onClick={atualizarManual} disabled={salvando}>Atualizar dados</button>
            </div>
            {resumo && <>
              <div className="admin-metricas">
                <article className="admin-metrica admin-metrica-total"><span>Senhas encontradas</span><strong>{resumo.total}</strong><small>No período filtrado</small></article>
                {Object.entries(resumo.porTipo).map(([tipo, quantidade]) => (
                  <article className={`admin-metrica admin-metrica-${tipo.toLowerCase()}`} key={tipo}>
                    <span>{nomesTipo[tipo] ?? tipo}</span><strong>{quantidade}</strong><small>{tipo}</small>
                  </article>
                ))}
              </div>
              <div className="admin-status-grid" aria-label="Senhas por situação">
                {Object.entries(nomesStatus).map(([status, nome]) => (
                  <div className="admin-status" key={status}><span>{nome}</span><strong>{resumo.porStatus[status] ?? 0}</strong></div>
                ))}
              </div>
              <div className="admin-colunas admin-graficos-colunas">
                <section className="admin-secao" aria-labelledby="grafico-tipos"><span className="admin-sobretitulo">GRÁFICO</span><h3 id="grafico-tipos">Por tipo</h3><GraficoBarras dados={dadosTipo} vazio="Sem senhas neste período." /></section>
                <section className="admin-secao" aria-labelledby="grafico-status"><span className="admin-sobretitulo">GRÁFICO</span><h3 id="grafico-status">Por situação</h3><GraficoBarras dados={dadosStatus} vazio="Sem senhas neste período." /></section>
              </div>
              <section className="admin-secao admin-grafico-dias" aria-labelledby="grafico-dias"><span className="admin-sobretitulo">GRÁFICO</span><h3 id="grafico-dias">Emissões por dia</h3><GraficoBarras dados={dadosDias} vazio="Nenhuma senha emitida no período." /></section>
            </>}
          </section>

          <section className="admin-secao" aria-labelledby="relatorio-titulo">
            <div className="admin-secao-cabecalho">
              <div><span className="admin-sobretitulo">RELATÓRIO</span><h2 id="relatorio-titulo">Senhas e auditoria do período</h2></div>
              <button type="button" className="admin-botao-secundario" onClick={carregarRelatorio} disabled={salvando}>Carregar relatório</button>
            </div>
            {relatorio && <>
              <p>Emitidas: {relatorio.total} · Atendidas: {relatorio.atendidas} · Tempo médio: {relatorio.tempoMedioMinutos === null ? "sem dados" : `${relatorio.tempoMedioMinutos} min`}</p>
              <p>Atendidas por tipo: SP {relatorio.atendidasPorTipo.SP} · SG {relatorio.atendidasPorTipo.SG} · SE {relatorio.atendidasPorTipo.SE}</p>
              {relatorio.detalhes.length === 0 ? <p className="admin-vazio">Nenhuma senha no período.</p> : (
                <div className="admin-tabela-rolagem"><table className="admin-tabela">
                  <thead><tr><th>Senha</th><th>Tipo</th><th>Situação</th><th>Emissão</th><th>Guichê</th><th>Atendente</th><th>1ª chamada</th><th>2ª chamada</th><th>Início</th><th>Fim</th></tr></thead>
                  <tbody>{relatorio.detalhes.map((senha) => <tr key={senha.numero}>
                    <td>{senha.numero}</td><td>{senha.tipo}</td><td>{senha.status.replaceAll("_", " ")}</td>
                    <td>{senha.emitida_em}</td><td>{senha.guiche ?? ""}</td><td>{senha.atendente ?? ""}</td>
                    <td>{senha.primeira_chamada_em ?? ""}</td><td>{senha.segunda_chamada_em ?? ""}</td>
                    <td>{senha.inicio_atendimento_em ?? ""}</td><td>{senha.finalizacao_em ?? ""}</td>
                  </tr>)}</tbody>
                </table></div>
              )}
            </>}
          </section>

          <div className="admin-colunas">
            <section className="admin-secao" aria-labelledby="chamadas-titulo">
              <span className="admin-sobretitulo">ACOMPANHAMENTO</span><h2 id="chamadas-titulo">Últimas chamadas</h2>
              {resumo?.ultimasChamadas.length ? (
                <ul className="admin-lista-chamadas">{resumo.ultimasChamadas.map((senha) => (
                  <li key={senha.numero}><strong>{senha.numero}</strong><span>Guichê {senha.guiche}</span><small>{senha.status.replaceAll("_", " ")}</small></li>
                ))}</ul>
              ) : <p className="admin-vazio">Nenhuma senha chamada no período.</p>}
            </section>
            <section className="admin-secao" aria-labelledby="fila-titulo">
              <span className="admin-sobretitulo">CONFIGURAÇÃO</span><h2 id="fila-titulo">Ordem da fila</h2>
              <p>SP continua alternando com as demais. Escolha qual será o próximo tipo entre SE e SG.</p>
              <form onSubmit={salvarFila} className="admin-form admin-form-vertical">
                <label>Próximo tipo não prioritário <select value={ordem} onChange={(e) => setOrdem(e.target.value)}><option value="SE">Exames (SE)</option><option value="SG">Geral (SG)</option></select></label>
                <button type="submit" disabled={salvando}>Salvar ordem</button>
              </form>
            </section>
          </div>

          <section className="admin-secao" aria-labelledby="usuarios-titulo">
            <div className="admin-secao-cabecalho"><div><span className="admin-sobretitulo">EQUIPE</span><h2 id="usuarios-titulo">Usuários</h2></div><span className="admin-contagem">{usuarios.length} cadastrados</span></div>
            {usuarios.length === 0 ? <p className="admin-vazio">Nenhum usuário cadastrado.</p> : (
              <div className="admin-tabela-rolagem"><table className="admin-tabela"><thead><tr><th>Nome</th><th>Login</th><th>Perfil</th><th>Situação</th></tr></thead>
                <tbody>{usuarios.map((usuario) => <tr key={usuario.id}><td><strong>{usuario.nome}</strong></td><td>{usuario.login}</td><td>{usuario.perfil === "GESTOR" ? "Gestor" : "Atendente"}</td><td><span className={`admin-etiqueta${usuario.ativo ? "" : " admin-etiqueta-inativa"}`}>{usuario.ativo ? "Ativo" : "Inativo"}</span></td></tr>)}</tbody>
              </table></div>
            )}
          </section>

          <div className="admin-colunas">
            <section className="admin-secao" aria-labelledby="cadastrar-titulo">
              <span className="admin-sobretitulo">ACESSOS</span><h2 id="cadastrar-titulo">Cadastrar usuário</h2>
              <p>Crie uma conta para um atendente ou outro gestor.</p>
              <form onSubmit={cadastrar} className="admin-form admin-form-vertical">
                <label>Login <input value={novo.login} onChange={(e) => setNovo({ ...novo, login: e.target.value })} required minLength={3} maxLength={80} autoComplete="off" /></label>
                <label>Nome <input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} required maxLength={120} /></label>
                <label>Perfil <select value={novo.perfil} onChange={(e) => setNovo({ ...novo, perfil: e.target.value })}><option value="ATENDENTE">Atendente</option><option value="GESTOR">Gestor</option></select></label>
                <label>Senha inicial <input type="password" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} required minLength={12} autoComplete="new-password" /></label>
                <button type="submit" disabled={salvando}>Cadastrar usuário</button>
              </form>
            </section>
            <section className="admin-secao" aria-labelledby="redefinir-titulo">
              <span className="admin-sobretitulo">ACESSOS</span><h2 id="redefinir-titulo">Redefinir senha</h2>
              <p>As sessões anteriores da conta serão encerradas.</p>
              <form onSubmit={redefinir} className="admin-form admin-form-vertical">
                <label>Usuário <select value={redefinicao.login} onChange={(e) => setRedefinicao({ ...redefinicao, login: e.target.value })} required><option value="">Selecione</option>{usuarios.filter((usuario) => usuario.ativo).map((usuario) => <option key={usuario.id} value={usuario.login}>{usuario.nome} ({usuario.login})</option>)}</select></label>
                <label>Nova senha <input type="password" value={redefinicao.novaSenha} onChange={(e) => setRedefinicao({ ...redefinicao, novaSenha: e.target.value })} required minLength={12} autoComplete="new-password" /></label>
                <button type="submit" disabled={salvando}>Redefinir senha</button>
              </form>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
