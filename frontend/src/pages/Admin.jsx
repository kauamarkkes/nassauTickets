import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import "../styles/global.css";

const nomesStatus = {
  EMITIDA: "Emitidas", AGUARDANDO: "Aguardando", CHAMADA: "Chamadas",
  CHAMADA_NOVAMENTE: "Chamadas novamente", EM_ATENDIMENTO: "Em atendimento",
  ATENDIDA: "Atendidas", "NÃO_COMPARECEU": "Não compareceram",
};
const nomesTipo = { SP: "Prioritária", SG: "Geral", SE: "Exames" };

export default function Admin() {
  const [resumo, setResumo] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [ordem, setOrdem] = useState("SE");
  const [novo, setNovo] = useState({ login: "", nome: "", perfil: "ATENDENTE", senha: "" });
  const [redefinicao, setRedefinicao] = useState({ login: "", novaSenha: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function atualizar() {
    const [dadosResumo, dadosUsuarios, dadosFila] = await Promise.all([
      apiRequest("/admin/resumo"), apiRequest("/admin/usuarios"), apiRequest("/admin/fila"),
    ]);
    setResumo(dadosResumo);
    setUsuarios(dadosUsuarios);
    setOrdem(dadosFila.proximoNaoPrioritario);
  }

  useEffect(() => {
    let ativo = true;
    Promise.all([
      apiRequest("/admin/resumo"), apiRequest("/admin/usuarios"), apiRequest("/admin/fila"),
    ]).then(([dadosResumo, dadosUsuarios, dadosFila]) => {
      if (!ativo) return;
      setResumo(dadosResumo);
      setUsuarios(dadosUsuarios);
      setOrdem(dadosFila.proximoNaoPrioritario);
    }).catch((falha) => { if (ativo) setErro(falha.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  async function executar(operacao, sucesso) {
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      await operacao();
      await atualizar();
      setMensagem(sucesso);
    } catch (falha) {
      setErro(falha.message);
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
      setErro(falha.message);
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

  const dataResumo = resumo?.data
    ? `${resumo.data.slice(4, 6)}/${resumo.data.slice(2, 4)}/20${resumo.data.slice(0, 2)}`
    : "Hoje";

  return (
    <main className="nt-container admin-page">
      <header className="admin-intro">
        <div>
          <span className="admin-sobretitulo">ÁREA DO GESTOR</span>
          <h1>Visão do atendimento</h1>
          <p>Acompanhe a operação e organize os acessos da equipe.</p>
        </div>
        <div className="admin-data"><span>REFERÊNCIA</span><strong>{dataResumo}</strong></div>
      </header>
      {erro && <p role="alert" className="admin-aviso admin-alerta">{erro}</p>}
      {mensagem && <p role="status" className="admin-aviso admin-sucesso">{mensagem}</p>}
      {carregando ? <p role="status" className="admin-carregando">Carregando informações do dia...</p> : (
        <>
          <section aria-labelledby="resumo-titulo">
            <div className="admin-secao-cabecalho">
              <div><span className="admin-sobretitulo">OPERAÇÃO</span><h2 id="resumo-titulo">Resumo do dia</h2></div>
              <button type="button" className="admin-botao-secundario" onClick={atualizarManual} disabled={salvando}>Atualizar dados</button>
            </div>
            {resumo && <>
              <div className="admin-metricas">
                <article className="admin-metrica admin-metrica-total"><span>Senhas emitidas</span><strong>{resumo.total}</strong><small>Total de hoje</small></article>
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
            </>}
          </section>

          <div className="admin-colunas">
            <section className="admin-secao" aria-labelledby="chamadas-titulo">
              <span className="admin-sobretitulo">ACOMPANHAMENTO</span><h2 id="chamadas-titulo">Últimas chamadas</h2>
              {resumo?.ultimasChamadas.length ? (
                <ul className="admin-lista-chamadas">{resumo.ultimasChamadas.map((senha) => (
                  <li key={senha.numero}><strong>{senha.numero}</strong><span>Guichê {senha.guiche}</span><small>{senha.status.replaceAll("_", " ")}</small></li>
                ))}</ul>
              ) : <p className="admin-vazio">Nenhuma senha chamada hoje.</p>}
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
